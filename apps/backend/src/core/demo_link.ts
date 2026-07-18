import { SITE_BASE } from './config.js'

// "We already built your preview" — a per-lead link to the Tier-1 demo,
// personalized via query params the demo page reads at load.
export function personalDemoLink(lead: { company_name: string; trade: string }, audit?: any) {
  const params = new URLSearchParams({
    co: lead.company_name,
    trade: lead.trade ?? '',
  })
  const topFlaw = audit?.flaws?.[0]?.type
  if (topFlaw) params.set('fix', topFlaw)
  return `${SITE_BASE}/demo/tier1-wedge/?${params.toString()}`
}
