// Real lead-list import — how Fieldstone actually "outsources to more
// areas": drop a CSV anywhere (KC-metro, nationwide, a purchased list, a
// manually curated one) and it merges in, deduped, ready for the next tick.
// No city/region restriction anywhere in this file or the pipeline it feeds —
// the only thing that ever scoped this engine to Kansas City was seed.ts's
// sample data, not the code.
//
// Usage: npm run import-leads -- path/to/leads.csv
// Expected header (any order, case-insensitive): company,website,email,trade,city
import { readFileSync } from 'node:fs'
import { db } from '../core/database.js'

const VALID_TRADES = new Set(['hvac', 'plumbing', 'electrical'])

// Minimal CSV split that still honors quoted fields containing commas —
// a real exported list (Google Sheets, a data broker) will have these.
function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') inQuotes = false
      else cur += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out.map(s => s.trim())
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function importLeadsCsv(path: string): { inserted: number; skipped: string[] } {
  const raw = readFileSync(path, 'utf-8')
  const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (!lines.length) return { inserted: 0, skipped: ['empty file'] }

  const header = parseCsvLine(lines[0]).map(h => h.toLowerCase())
  const col = (name: string) => header.indexOf(name)
  const idx = {
    company: col('company'), website: col('website'), email: col('email'),
    trade: col('trade'), city: col('city'),
  }
  if (idx.company < 0 || idx.email < 0)
    throw new Error(`CSV header must include at least "company,email" — got: ${header.join(',')}`)

  const insert = db.prepare(
    `INSERT OR IGNORE INTO leads (id, company_name, website_url, contact_email, trade, city)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )

  let inserted = 0
  const skipped: string[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i])
    const company = cells[idx.company]?.trim()
    const email = cells[idx.email]?.trim().toLowerCase()
    const website = idx.website >= 0 ? cells[idx.website]?.trim() : ''
    const trade = idx.trade >= 0 ? cells[idx.trade]?.trim().toLowerCase() : ''
    const city = idx.city >= 0 ? cells[idx.city]?.trim() : ''

    if (!company || !email) { skipped.push(`row ${i + 1}: missing company or email`); continue }
    if (!EMAIL_RE.test(email)) { skipped.push(`row ${i + 1}: invalid email "${email}"`); continue }
    if (trade && !VALID_TRADES.has(trade)) { skipped.push(`row ${i + 1}: unknown trade "${trade}" (expected hvac/plumbing/electrical)`); continue }

    const id = `lead_${slugify(company)}_${slugify(email.split('@')[1] ?? '')}`
    const r = insert.run(id, company, website || `https://${slugify(company)}.com`, email, trade || null, city || null)
    if (r.changes) inserted++
    else skipped.push(`row ${i + 1}: duplicate email "${email}" (already in the system, or a company/domain repeat) — skipped`)
  }
  return { inserted, skipped }
}

// CLI entry point: npm run import-leads -- path/to/file.csv
if (process.argv[1]?.endsWith('import_leads.ts') || process.argv[1]?.endsWith('import_leads.js')) {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage: npm run import-leads -- path/to/leads.csv')
    process.exit(1)
  }
  const { inserted, skipped } = importLeadsCsv(filePath)
  console.log(`Imported ${inserted} new lead(s).`)
  if (skipped.length) {
    console.log(`Skipped ${skipped.length}:`)
    skipped.forEach(s => console.log(`  - ${s}`))
  }
}
