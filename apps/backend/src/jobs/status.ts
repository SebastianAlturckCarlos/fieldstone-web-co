import { db } from '../core/database.js'
import { spentToday } from '../core/ledger.js'
import { DAILY_TOKEN_BUDGET_USD } from '../core/config.js'

export function printStatus() {
  console.log('--- Pipeline ---')
  const rows = db.prepare(
    `SELECT lead_status, COUNT(*) AS n FROM leads GROUP BY lead_status ORDER BY n DESC`,
  ).all() as { lead_status: string; n: number }[]
  for (const r of rows) console.log(`  ${r.lead_status.padEnd(12)} ${r.n}`)

  const fails = db.prepare(
    `SELECT company_name, fail_reason FROM leads WHERE lead_status = 'failed'`,
  ).all() as { company_name: string; fail_reason: string }[]
  for (const f of fails) console.log(`    failed: ${f.company_name} — ${f.fail_reason}`)

  console.log('\n--- Approval queue (drafted, awaiting human) ---')
  const drafts = db.prepare(
    `SELECT o.subject, o.qa_score, l.company_name FROM outreach_emails o
     JOIN leads l ON l.id = o.lead_id WHERE o.approved_by IS NULL AND o.sent_at IS NULL`,
  ).all() as { subject: string; qa_score: number; company_name: string }[]
  for (const d of drafts) console.log(`  [${d.qa_score}] ${d.company_name}: "${d.subject}"`)
  if (!drafts.length) console.log('  (empty)')

  console.log('\n--- Ledger (today) ---')
  const ledger = db.prepare(
    `SELECT agent_id, mode, COUNT(*) AS runs, SUM(input_tokens) AS tin,
            SUM(output_tokens) AS tout, SUM(est_cost_usd) AS cost
     FROM agent_runs WHERE date(ran_at) = date('now') GROUP BY agent_id, mode`,
  ).all() as any[]
  for (const r of ledger)
    console.log(`  ${r.agent_id.padEnd(18)} ${r.mode.padEnd(12)} runs=${r.runs}  in=${r.tin}  out=${r.tout}  $${r.cost.toFixed(4)}`)
  console.log(`  TOTAL spend today: $${spentToday().toFixed(4)} / $${DAILY_TOKEN_BUDGET_USD} cap`)
}

// Run directly via `npm run status`
if (process.argv[1]?.replace(/\\/g, '/').endsWith('jobs/status.ts')) printStatus()
