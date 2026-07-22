// Competitive intelligence: the Researcher's site-fetch machinery, pointed at
// known trade-software competitors instead of a prospect. The Competitor
// Agent reads each public marketing/pricing page and extracts one real,
// honest wedge Fieldstone can use — no scraping of anything non-public, the
// same trust level as a human visiting a pricing page in a browser.
//
// Results land in kv('competitor_intel') as the single source of truth: the
// CMO agent gets the sharpest angle as an optional 'edge' in its payload
// (orchestrator.ts), and the Analytics digest gets the full note set — both
// read-only consumers, this job is the only writer.
import { db } from '../core/database.js'
import { runAgent } from '../workers/worker_router.js'
import { fetchSiteBundle } from '../core/site_fetch.js'
import { emitEvent } from '../core/events.js'
import { AGENT_MODE } from '../core/config.js'

// Direct competitors in Fieldstone's exact lane: operational/dispatch
// software for multi-truck HVAC, plumbing, and electrical shops. Public
// marketing pages only.
const COMPETITORS = [
  { name: 'ServiceTitan', url: 'https://www.servicetitan.com/' },
  { name: 'Housecall Pro', url: 'https://www.housecallpro.com/' },
  { name: 'Jobber', url: 'https://getjobber.com/' },
  { name: 'FieldEdge', url: 'https://www.fieldedge.com/' },
  { name: 'Service Fusion', url: 'https://www.servicefusion.com/' },
]

export interface CompetitorNote {
  competitor: string
  positioning: string
  pricing_signal: string | null
  weakness: string
  fieldstone_angle: string
}

export async function runCompetitorScan(source = 'manual'): Promise<{ notes: CompetitorNote[]; skipped: string[] }> {
  if (AGENT_MODE === 'dry-run') {
    emitEvent('feed', { msg: 'competitor scan skipped (dry-run has no real fetches)', kind: 'system' })
    return { notes: [], skipped: COMPETITORS.map(c => `${c.name}: dry-run`) }
  }

  const notes: CompetitorNote[] = []
  const skipped: string[] = []

  for (const c of COMPETITORS) {
    try {
      const site = await fetchSiteBundle(c.url)
      if (site.fetch_error || !site.html_excerpt) {
        skipped.push(`${c.name}: ${site.fetch_error ?? 'no content'}`)
        continue
      }
      const note = await runAgent('competitor_agent', { html: site.html_excerpt }) as CompetitorNote
      notes.push({ ...note, competitor: note.competitor || c.name })
    } catch (err) {
      skipped.push(`${c.name}: ${(err as Error).message.slice(0, 100)}`)
    }
  }

  if (notes.length) {
    db.prepare(`INSERT OR REPLACE INTO kv (k, v, updated_at) VALUES ('competitor_intel', ?, CURRENT_TIMESTAMP)`)
      .run(JSON.stringify({ notes, scanned_at: new Date().toISOString() }))
  }

  emitEvent('feed', { msg: `competitor scan (${source}): ${notes.length} analyzed, ${skipped.length} skipped`, kind: 'system' })
  emitEvent('pulse', { n: 3 })
  console.log(`[competitor_scan:${source}] ${notes.length} notes, ${skipped.length} skipped`)
  return { notes, skipped }
}
