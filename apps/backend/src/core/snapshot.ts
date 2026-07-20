// Screenshot engine: renders the brand-themed mockup in a real headless
// browser and saves the PNG the outreach email embeds. Uses puppeteer-core
// against the Chrome/Edge already installed on this machine — no 170MB
// bundled-Chromium download, no new binary to trust.
//
// Failure posture: a snapshot is an enhancer, never a gate. Any failure
// (no browser, no puppeteer-core, render timeout) logs once and returns null;
// the pipeline continues and the email simply ships without an image.
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderMockupHtml, type MockupOptions } from './mockup_template.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const SNAPSHOT_DIR = path.resolve(here, '../../snapshots')

const BROWSER_CANDIDATES = [
  process.env.SNAPSHOT_BROWSER_PATH ?? '',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)

let warnedOnce = false
function findBrowser(): string | null {
  for (const p of BROWSER_CANDIDATES) if (existsSync(p)) return p
  return null
}

export function snapshotFile(leadId: string): string {
  return path.join(SNAPSHOT_DIR, `${leadId}.png`)
}

export async function captureLeadSnapshot(leadId: string, opts: MockupOptions): Promise<string | null> {
  const executablePath = findBrowser()
  if (!executablePath) {
    if (!warnedOnce) { warnedOnce = true; console.log('[snapshot] no Chrome/Edge found — set SNAPSHOT_BROWSER_PATH; emails will ship without preview images') }
    return null
  }
  let puppeteer: any
  try {
    puppeteer = (await import('puppeteer-core' as string)).default
  } catch {
    if (!warnedOnce) { warnedOnce = true; console.log('[snapshot] puppeteer-core not installed (npm install) — emails will ship without preview images') }
    return null
  }

  mkdirSync(SNAPSHOT_DIR, { recursive: true })
  const outPath = snapshotFile(leadId)
  let browser: any = null
  try {
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-first-run', '--disable-extensions', '--hide-scrollbars'],
    })
    const page = await browser.newPage()
    // DPR 2 → crisp on retina/phone screens where cold email actually gets read
    await page.setViewport({ width: 1360, height: 760, deviceScaleFactor: 2 })
    // networkidle0 waits for the prospect's logo; the 15s cap keeps a slow
    // logo host from stalling the whole tick.
    await page.setContent(renderMockupHtml(opts), { waitUntil: 'networkidle0', timeout: 15_000 })
      .catch(() => {/* timeout: render what we have — text/colors are already in */})
    await page.screenshot({ path: outPath, type: 'png', fullPage: false })
    return outPath
  } catch (err) {
    console.log(`[snapshot] capture failed for ${leadId}: ${(err as Error).message.slice(0, 120)}`)
    return null
  } finally {
    if (browser) await browser.close().catch(() => {})
  }
}
