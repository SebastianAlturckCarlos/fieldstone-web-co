// Fetch the prospect's real site so the Researcher audits evidence, not vibes.
// In dry-run mode this is never called (mocks carry canned audits). A dead or
// unreachable site is itself the most expensive flaw a trades business can
// have, so fetch errors are passed through as data — never thrown.
import { extractBrand, type BrandBundle } from './brand_extract.js'

export interface SiteBundle {
  url: string
  status: number | null
  content_type: string | null
  html_excerpt: string | null   // first slice of markup, script/style stripped
  fetch_error: string | null
  fetched_ms: number
  brand: BrandBundle | null     // colors + logo parsed from the RAW page (pre-strip)
}

// Generous slice — this machine runs the agents locally with headroom to
// spare, and a deeper excerpt is what lets the Researcher cite real evidence
// instead of guessing from a truncated <head>.
const EXCERPT_LIMIT = 32_000

export async function fetchSiteBundle(url: string): Promise<SiteBundle> {
  const started = Date.now()
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 10_000)
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; FieldstoneAudit/1.0)' },
    })
    clearTimeout(timer)
    const raw = await res.text()
    // Brand lives in the parts the audit excerpt throws away (<style>, meta,
    // icon links) — extract it from the raw markup first.
    const brand = extractBrand(raw, res.url || url)
    const excerpt = raw
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/\s{3,}/g, ' ')
      .slice(0, EXCERPT_LIMIT)
    return {
      url, status: res.status,
      content_type: res.headers.get('content-type'),
      html_excerpt: excerpt, fetch_error: null,
      fetched_ms: Date.now() - started,
      brand,
    }
  } catch (err) {
    return {
      url, status: null, content_type: null, html_excerpt: null,
      fetch_error: (err as Error).message, fetched_ms: Date.now() - started,
      brand: null,
    }
  }
}
