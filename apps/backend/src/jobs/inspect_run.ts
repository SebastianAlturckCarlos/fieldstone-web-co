// Dev helper: summarize the latest engine run — failures, ledger, sample draft.
import { db } from '../core/database.js'

const fails = db.prepare(`SELECT company_name, fail_reason FROM leads WHERE lead_status='failed'`).all() as any[]
console.log('FAILED:', JSON.stringify(fails))

console.log('LEDGER:')
for (const r of db.prepare(
  `SELECT agent_id, mode, COUNT(*) runs, SUM(input_tokens) tin, SUM(output_tokens) tout
   FROM agent_runs GROUP BY agent_id, mode`,
).all() as any[]) {
  console.log(`  ${r.agent_id} [${r.mode}] runs=${r.runs} in=${r.tin} out=${r.tout}`)
}

const d = db.prepare(
  `SELECT o.subject, o.body, o.qa_score, o.consult_json, l.company_name
   FROM outreach_emails o JOIN leads l ON l.id = o.lead_id ORDER BY o.id LIMIT 1`,
).get() as any
if (d) {
  console.log(`--- SAMPLE DRAFT [qa ${d.qa_score}] ${d.company_name} ---`)
  console.log('Subject:', d.subject)
  console.log(d.body)
  if (d.consult_json) console.log('CONSULT:', d.consult_json.slice(0, 200))
}
