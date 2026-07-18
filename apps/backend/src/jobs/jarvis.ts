// Sprint 6 — JARVIS: talk to the engine. The conversation rides claude-code
// (subscription, hard-stop) and every state change goes through a whitelisted
// action protocol — the model can only do what the dashboard buttons can do.
// In dry-run mode a keyword parser answers instead, so the interface is fully
// exercisable offline.
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { db } from '../core/database.js'
import { AGENT_MODE, SEND_MODE, DAILY_TOKEN_BUDGET_USD } from '../core/config.js'
import { spentToday } from '../core/ledger.js'
import { emitEvent } from '../core/events.js'
import { sendPausedReason } from './send.js'
import { sendFollowup, dismissFollowup, resumeSends } from './replies.js'
import { runDigest } from './digest.js'
import { runDevAgentCycle } from './dev_agent.js'

const execFileAsync = promisify(execFile)

type Action =
  | { type: 'approve_draft' | 'reject_draft'; id: number }
  | { type: 'send_followup' | 'dismiss_followup'; id: number }
  | { type: 'pause_sends' | 'resume_sends' | 'run_digest' | 'run_dev_agent' }

function snapshot() {
  const funnel: Record<string, number> = {}
  for (const r of db.prepare(`SELECT lead_status s, COUNT(*) n FROM leads GROUP BY s`).all() as any[])
    funnel[r.s] = r.n
  const approvals = db.prepare(
    `SELECT o.id, l.company_name, o.subject, o.qa_score FROM outreach_emails o
     JOIN leads l ON l.id = o.lead_id
     WHERE o.approved_by IS NULL AND o.sent_at IS NULL AND l.lead_status = 'drafted'`,
  ).all()
  const followups = db.prepare(
    `SELECT rd.id, l.company_name, rd.sentiment, rd.urgency FROM reply_drafts rd
     JOIN leads l ON l.id = rd.lead_id WHERE rd.status = 'pending' AND rd.suggested_reply IS NOT NULL`,
  ).all()
  return {
    mode: AGENT_MODE, send_mode: SEND_MODE,
    funnel, approvals, followups,
    spend_today_usd: spentToday(), spend_cap_usd: DAILY_TOKEN_BUDGET_USD,
    sends_paused: sendPausedReason(),
  }
}

async function execute(action: Action): Promise<string> {
  switch (action.type) {
    case 'approve_draft': {
      const d = db.prepare(
        `SELECT o.id, o.lead_id, l.company_name FROM outreach_emails o
         JOIN leads l ON l.id = o.lead_id WHERE o.id = ? AND o.approved_by IS NULL`,
      ).get(action.id) as any
      if (!d) return `Draft #${action.id} not found or already handled.`
      db.prepare(`UPDATE outreach_emails SET approved_by = 'human' WHERE id = ?`).run(d.id)
      db.prepare(`UPDATE leads SET lead_status = 'validated', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(d.lead_id)
      emitEvent('feed', { msg: `approved via JARVIS: ${d.company_name}`, kind: 'approve' })
      emitEvent('pulse', { n: 5 })
      return `Approved the ${d.company_name} draft — it sends on the next cycle.`
    }
    case 'reject_draft': {
      const d = db.prepare(
        `SELECT o.id, o.lead_id, l.company_name FROM outreach_emails o
         JOIN leads l ON l.id = o.lead_id WHERE o.id = ? AND o.approved_by IS NULL`,
      ).get(action.id) as any
      if (!d) return `Draft #${action.id} not found or already handled.`
      db.prepare(`UPDATE outreach_emails SET approved_by = 'human_rejected' WHERE id = ?`).run(d.id)
      db.prepare(`UPDATE leads SET lead_status = 'failed', fail_reason = 'human_rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(d.lead_id)
      emitEvent('feed', { msg: `rejected via JARVIS: ${d.company_name}`, kind: 'reject' })
      return `Rejected the ${d.company_name} draft.`
    }
    case 'send_followup': {
      const r = await sendFollowup(action.id)
      return r.ok ? `Follow-up #${action.id} sent.` : `Couldn't send follow-up #${action.id}: ${r.error}`
    }
    case 'dismiss_followup':
      return dismissFollowup(action.id) ? `Follow-up #${action.id} dismissed.` : `Follow-up #${action.id} not found or already handled.`
    case 'pause_sends':
      db.prepare(`INSERT OR REPLACE INTO kv (k, v, updated_at) VALUES ('send_paused', 'paused via JARVIS', CURRENT_TIMESTAMP)`).run()
      emitEvent('feed', { msg: 'sends paused via JARVIS', kind: 'alert' })
      return 'All outbound sends are paused until you resume them.'
    case 'resume_sends':
      resumeSends()
      return 'Sends resumed.'
    case 'run_digest':
      await runDigest('jarvis')
      return 'Digest generated — it\'s on the Growth screen and in the vault.'
    case 'run_dev_agent': {
      const r: any = await runDevAgentCycle('jarvis')
      return r?.proposed ? `Dev Agent proposed a new skill: ${r.proposed}. It's waiting for your code review.` : 'Dev Agent found no capability gap worth a new skill right now.'
    }
    default:
      return 'Unknown action.'
  }
}

const ALLOWED_ACTIONS = new Set([
  'approve_draft', 'reject_draft', 'send_followup', 'dismiss_followup',
  'pause_sends', 'resume_sends', 'run_digest', 'run_dev_agent',
])

const JARVIS_SYSTEM = `You are JARVIS, the voice of Fieldstone Web Co's client-acquisition engine, speaking for the CEO agent. You receive the engine's live state as JSON plus the operator's message. Answer in 1-3 tight sentences — spoken-word cadence, numbers first, no filler, no markdown. If (and only if) the operator clearly requests one of these actions, append it: approve_draft(id), reject_draft(id), send_followup(id), dismiss_followup(id), pause_sends, resume_sends, run_digest, run_dev_agent. Match companies to draft ids from the state yourself. Never invent ids; if ambiguous, ask which one. Output ONLY JSON: {"reply": str, "action": {"type": str, "id"?: number} | null}`

function dryRunJarvis(message: string, state: any): { reply: string; action: Action | null } {
  const m = message.toLowerCase()
  const firstId = (list: any[]) => list[0]?.id
  if (/pause/.test(m)) return { reply: 'Pausing all outbound sends.', action: { type: 'pause_sends' } }
  if (/resume|unpause/.test(m)) return { reply: 'Resuming sends.', action: { type: 'resume_sends' } }
  if (/digest/.test(m)) return { reply: 'Running the daily digest now.', action: { type: 'run_digest' } }
  if (/dev agent|skill/.test(m)) return { reply: 'Asking the Dev Agent to check for capability gaps.', action: { type: 'run_dev_agent' } }
  if (/approve/.test(m)) {
    const named = state.approvals.find((a: any) => m.includes(String(a.company_name).toLowerCase().split(' ')[0]))
    const id = named?.id ?? (Number(m.match(/\d+/)?.[0]) || firstId(state.approvals))
    return id
      ? { reply: `Approving draft #${id}.`, action: { type: 'approve_draft', id } }
      : { reply: 'Nothing is waiting for approval.', action: null }
  }
  if (/reject/.test(m)) {
    const id = Number(m.match(/\d+/)?.[0]) || firstId(state.approvals)
    return id
      ? { reply: `Rejecting draft #${id}.`, action: { type: 'reject_draft', id } }
      : { reply: 'Nothing is waiting for approval.', action: null }
  }
  const f = state.funnel
  return {
    reply: `Pipeline: ${f.pending ?? 0} pending, ${f.drafted ?? 0} drafted, ${f.sent ?? 0} sent, ${f.converted ?? 0} converted. ${state.approvals.length} draft(s) and ${state.followups.length} follow-up(s) need you. Spend today $${state.spend_today_usd.toFixed(2)}.${state.sends_paused ? ' Sends are PAUSED.' : ''}`,
    action: null,
  }
}

export async function handleJarvis(message: string): Promise<{ reply: string; action?: string }> {
  const state = snapshot()

  let parsed: { reply: string; action: Action | null }
  if (AGENT_MODE === 'claude-code') {
    const prompt = `${JARVIS_SYSTEM}\n\n---\nEngine state:\n${JSON.stringify(state)}\n\nOperator: ${message}`
    // No shell — see worker_router.ts: shell:true mangles multi-line prompts on Windows
    const { stdout } = await execFileAsync(
      'claude', ['-p', prompt, '--output-format', 'json', '--model', 'claude-haiku-4-5-20251001'],
      { timeout: 60_000, maxBuffer: 1024 * 1024 },
    )
    const wrapper = JSON.parse(stdout)
    const cleaned = String(wrapper.result ?? '').trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    try { parsed = JSON.parse(cleaned) } catch { parsed = { reply: cleaned || 'I did not catch that.', action: null } }
  } else {
    parsed = dryRunJarvis(message, state)
  }

  let actionResult: string | undefined
  if (parsed.action && ALLOWED_ACTIONS.has(parsed.action.type)) {
    actionResult = await execute(parsed.action as Action)
  }
  emitEvent('pulse', { n: 4 })
  return { reply: actionResult ? `${parsed.reply} ${actionResult}`.trim() : parsed.reply, action: parsed.action?.type }
}
