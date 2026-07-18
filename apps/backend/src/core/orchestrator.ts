import { db } from './database.js'
import { runAgent } from '../workers/worker_router.js'
import { assertUnderBudget, assertLeadUnderBudget, BudgetExceeded } from './ledger.js'
import { emitEvent } from './events.js'
import { personalDemoLink } from './demo_link.js'
import { commitEpisodicMemory } from './memory.js'
import { fetchSiteBundle } from './site_fetch.js'
import { AGENT_MODE } from './config.js'

const BATCH_SIZE = 5
const MAX_QA_LOOPS = 3

type Lead = {
  id: string; company_name: string; website_url: string; contact_email: string
  trade: string; city: string; lead_status: string
}

function transition(lead: Lead, status: string, extra: { audit?: any; failReason?: string } = {}) {
  db.prepare(`UPDATE leads SET lead_status = ?, fail_reason = ?, audit_json = COALESCE(?, audit_json),
              updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(status, extra.failReason ?? null, extra.audit ? JSON.stringify(extra.audit) : null, lead.id)
  console.log(`  [${lead.company_name}] -> ${status}${extra.failReason ? ` (${extra.failReason})` : ''}`)
  emitEvent('feed', {
    msg: `${lead.company_name} -> ${status}${extra.failReason ? ` (${extra.failReason})` : ''}`,
    kind: status === 'failed' ? 'fail' : status,
  })
  emitEvent('pulse', { n: status === 'drafted' ? 4 : 2 })
  if (status === 'failed') {
    commitEpisodicMemory(lead.id, `fail:${extra.failReason ?? 'unknown'}`, {
      company: lead.company_name, trade: lead.trade, reason: extra.failReason,
    })
  }
}

export async function tick() {
  assertUnderBudget()

  const leads = db.prepare(
    `UPDATE leads SET lead_status = 'processing', updated_at = CURRENT_TIMESTAMP
     WHERE id IN (SELECT id FROM leads WHERE lead_status = 'pending' LIMIT ?)
     RETURNING *`,
  ).all(BATCH_SIZE) as Lead[]

  if (!leads.length) {
    console.log('No pending leads.')
    return
  }
  console.log(`Claimed ${leads.length} lead(s).`)

  for (const lead of leads) {
    try {
      assertUnderBudget()
      assertLeadUnderBudget(lead.id)

      // 1. Audit — Researcher works from the REAL site (fetched here) outside
      //    dry-run; an unreachable site is passed through as evidence, since
      //    that's the most expensive flaw a trades business can have.
      const sitePayload: any = {
        company_name: lead.company_name, website_url: lead.website_url, trade: lead.trade,
      }
      if (AGENT_MODE !== 'dry-run') sitePayload.site = await fetchSiteBundle(lead.website_url)
      const audit = await runAgent('researcher_agent', sitePayload, lead.id)
      if (!audit.flaws?.length) { transition(lead, 'failed', { failReason: 'no_flaws' }); continue }
      transition(lead, 'audited', { audit })

      // 2. Creation <-> review loop: CMO drafts from the Researcher's
      //    evidence, CEO scores against the rubric, rejection feedback goes
      //    straight back to the CMO. Distinct roles, real consultation.
      const demo_link = personalDemoLink(lead, audit)
      let draft: any, verdict: any, feedback = ''
      for (let i = 0; i < MAX_QA_LOOPS; i++) {
        assertLeadUnderBudget(lead.id)
        draft = await runAgent('cmo_agent', { audit, feedback, demo_link }, lead.id)
        verdict = await runAgent('ceo_agent', { draft, audit }, lead.id)
        if (verdict.approved) break
        feedback = verdict.feedback
        commitEpisodicMemory(lead.id, 'qa_reject', { company: lead.company_name, score: verdict.score, feedback })
        console.log(`  [${lead.company_name}] QA reject (${verdict.score}) — revising`)
      }
      if (!verdict.approved) { transition(lead, 'failed', { failReason: 'qa_exhausted' }); continue }

      // 3. Sales Rep consult — conversion review of the CEO-approved draft.
      //    A weak click score buys ONE more CMO revision (with the Sales
      //    Rep's notes as feedback) before the human sees it. Consult
      //    failures never fail the lead; the draft is already QA-approved.
      let consult: any = null
      try {
        consult = await runAgent('sales_consult', {
          draft, company_name: lead.company_name, trade: lead.trade, demo_link,
        }, lead.id)
        if (consult && consult.click_score < 60) {
          console.log(`  [${lead.company_name}] consult ${consult.click_score} — one conversion revision`)
          const revised = await runAgent('cmo_agent', {
            audit, feedback: `Sales Rep conversion notes: ${consult.notes?.join(' | ')}`, demo_link,
          }, lead.id)
          const reVerdict = await runAgent('ceo_agent', { draft: revised, audit }, lead.id)
          if (reVerdict.approved) {
            draft = revised
            verdict = reVerdict
            consult = await runAgent('sales_consult', {
              draft, company_name: lead.company_name, trade: lead.trade, demo_link,
            }, lead.id)
          }
        }
        if (consult?.subject_alt) draft.subject = consult.subject_alt
      } catch (err) {
        console.log(`  [${lead.company_name}] consult skipped: ${(err as Error).message.slice(0, 80)}`)
      }

      // 4. Queue for the human approval gate
      db.prepare(`INSERT INTO outreach_emails (lead_id, subject, body, qa_score, consult_json) VALUES (?, ?, ?, ?, ?)`)
        .run(lead.id, draft.subject, draft.body, verdict.score, consult ? JSON.stringify(consult) : null)
      transition(lead, 'drafted')
    } catch (err) {
      if (err instanceof BudgetExceeded) {
        // Return the lead to the queue untouched and stop the whole tick —
        // budget stops are a pause, not a lead failure.
        db.prepare(`UPDATE leads SET lead_status = 'pending' WHERE id = ?`).run(lead.id)
        console.log(`BUDGET STOP: ${err.message}`)
        return
      }
      transition(lead, 'failed', { failReason: `error: ${(err as Error).message.slice(0, 120)}` })
    }
  }
}
