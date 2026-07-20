// Sprint 3: the reply side of outreach. Incoming replies (webhook or pasted
// into the dashboard) get classified by the Sales Rep agent; unsubscribes hit
// suppression instantly; positives raise a hot-lead alert; the suggested
// follow-up waits for a human click — it never sends itself.
import { db } from '../core/database.js'
import { runAgent } from '../workers/worker_router.js'
import { emitEvent } from '../core/events.js'
import { AGENT_MODE, SEND_MODE } from '../core/config.js'
import { deliver, sendPausedReason, isTestAddress } from './send.js'

const CALENDAR_LINK = process.env.CALENDAR_LINK ?? ''

export interface ClassifiedReply {
  id: number
  sentiment: string
  intent: string
  urgency: number
  action: string
  suggested_reply: string | null
}

function suppress(email: string, reason: 'unsubscribe' | 'hard_bounce' | 'complaint' | 'manual') {
  db.prepare(`INSERT OR IGNORE INTO suppression (email, reason) VALUES (?, ?)`).run(email, reason)
}

// ── Classification ──────────────────────────────────────────────────────────

export async function classifyReply(outreachId: number, replyText: string, source = 'manual'): Promise<ClassifiedReply> {
  const row = db.prepare(
    `SELECT o.id, o.lead_id, o.subject, l.company_name, l.contact_email, l.trade
     FROM outreach_emails o JOIN leads l ON l.id = o.lead_id WHERE o.id = ?`,
  ).get(outreachId) as any
  if (!row) throw new Error(`unknown outreach email #${outreachId}`)

  const out = await runAgent('sales_rep_agent', {
    reply_text: replyText,
    company_name: row.company_name,
    trade: row.trade,
    original_subject: row.subject,
    calendar_link: CALENDAR_LINK,
  }, row.lead_id)

  db.prepare(
    `UPDATE outreach_emails SET replied_at = CURRENT_TIMESTAMP, reply_sentiment = ? WHERE id = ?`,
  ).run(out.sentiment, outreachId)

  const r = db.prepare(
    `INSERT INTO reply_drafts (outreach_id, lead_id, reply_text, sentiment, intent, urgency, action, suggested_reply)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(outreachId, row.lead_id, replyText, out.sentiment, out.intent, out.urgency, out.action, out.suggested_reply)

  // Compliance + routing per classification
  if (out.sentiment === 'unsubscribe') {
    suppress(row.contact_email, 'unsubscribe')
    db.prepare(`UPDATE leads SET lead_status='failed', fail_reason='unsubscribe', updated_at=CURRENT_TIMESTAMP WHERE id = ?`).run(row.lead_id)
    emitEvent('feed', { msg: `unsubscribe honored: ${row.company_name}`, kind: 'system' })
  } else if (out.sentiment === 'bounce') {
    suppress(row.contact_email, 'hard_bounce')
    db.prepare(`UPDATE leads SET lead_status='failed', fail_reason='bounce', updated_at=CURRENT_TIMESTAMP WHERE id = ?`).run(row.lead_id)
  } else if (out.sentiment === 'positive') {
    // The "push notification": SSE alert + feed + a visible burst on the sphere
    emitEvent('alert', { msg: `HOT LEAD — ${row.company_name} replied positive (urgency ${out.urgency}/5). Follow-up drafted, awaiting your send.` })
    emitEvent('feed', { msg: `positive reply: ${row.company_name} → follow-up drafted`, kind: 'approve' })
    emitEvent('pulse', { n: 8 })
  } else {
    emitEvent('feed', { msg: `reply classified ${out.sentiment}: ${row.company_name}`, kind: 'system' })
  }

  console.log(`[replies:${source}] #${outreachId} ${row.company_name} → ${out.sentiment}/${out.action}`)
  return { id: Number(r.lastInsertRowid), ...out }
}

// ── Delivery engagement events (Resend webhook) ─────────────────────────────

export function recordEngagement(resendMessageId: string, event: string): boolean {
  const row = db.prepare(
    `SELECT o.id, o.lead_id, l.company_name, l.contact_email
     FROM outreach_emails o JOIN leads l ON l.id = o.lead_id WHERE o.resend_message_id = ?`,
  ).get(resendMessageId) as any
  if (!row) return false

  if (event === 'opened') {
    db.prepare(`UPDATE outreach_emails SET opened_at = COALESCE(opened_at, CURRENT_TIMESTAMP) WHERE id = ?`).run(row.id)
    emitEvent('feed', { msg: `opened: ${row.company_name}`, kind: 'system' })
    emitEvent('pulse', { n: 3 })
  } else if (event === 'bounced') {
    suppress(row.contact_email, 'hard_bounce')
    db.prepare(`UPDATE leads SET lead_status='failed', fail_reason='bounce', updated_at=CURRENT_TIMESTAMP WHERE id = ?`).run(row.lead_id)
    emitEvent('feed', { msg: `bounce: ${row.company_name} — suppressed`, kind: 'alert' })
    bounceCircuitBreaker()
  } else if (event === 'complained') {
    suppress(row.contact_email, 'complaint')
    emitEvent('feed', { msg: `spam complaint: ${row.company_name} — suppressed`, kind: 'alert' })
    bounceCircuitBreaker()
  } else if (event === 'delivered') {
    emitEvent('feed', { msg: `delivered: ${row.company_name}`, kind: 'sent' })
  }
  return true
}

// Risk register: >5% bounce rate in a day's batch → auto-pause sends + alert.
function bounceCircuitBreaker() {
  const t = db.prepare(
    `SELECT
       (SELECT COUNT(*) FROM outreach_emails WHERE date(sent_at) = date('now')) sends,
       (SELECT COUNT(*) FROM leads WHERE fail_reason='bounce' AND date(updated_at) = date('now')) bounces`,
  ).get() as any
  if (t.sends >= 5 && t.bounces / t.sends > 0.05) {
    const reason = `bounce rate ${t.bounces}/${t.sends} today exceeds 5% — auto-paused, review the list then POST /api/send/resume`
    db.prepare(`INSERT OR REPLACE INTO kv (k, v, updated_at) VALUES ('send_paused', ?, CURRENT_TIMESTAMP)`).run(reason)
    emitEvent('alert', { msg: reason })
  }
}

export function resumeSends(): void {
  db.prepare(`DELETE FROM kv WHERE k = 'send_paused'`).run()
  emitEvent('feed', { msg: 'sends resumed by human', kind: 'system' })
}

// ── Follow-up dispatch (human-triggered only) ───────────────────────────────

export async function sendFollowup(replyDraftId: number): Promise<{ ok: boolean; error?: string }> {
  const d = db.prepare(
    `SELECT rd.id, rd.suggested_reply, rd.status, o.subject, o.snapshot_path,
            l.company_name, l.contact_email, l.id AS lead_id
     FROM reply_drafts rd
     JOIN outreach_emails o ON o.id = rd.outreach_id
     JOIN leads l ON l.id = rd.lead_id
     WHERE rd.id = ?`,
  ).get(replyDraftId) as any
  if (!d) return { ok: false, error: 'unknown follow-up draft' }
  if (d.status !== 'pending') return { ok: false, error: `follow-up already ${d.status}` }
  if (!d.suggested_reply) return { ok: false, error: 'no suggested reply on this draft' }

  const paused = sendPausedReason()
  if (paused && SEND_MODE !== 'mock') return { ok: false, error: `sends paused: ${paused}` }
  if (SEND_MODE === 'resend' && AGENT_MODE === 'dry-run')
    return { ok: false, error: 'refusing real delivery of a canned dry-run follow-up — set AGENT_MODE=claude-code' }
  if (SEND_MODE === 'resend' && isTestAddress(d.contact_email))
    return { ok: false, error: 'test/example address — not sendable' }
  if (db.prepare(`SELECT 1 FROM suppression WHERE email = ?`).get(d.contact_email))
    return { ok: false, error: 'address is suppressed' }

  // Follow-ups ride the reply thread — no cold-email footer requirements, but
  // we keep the opt-out line anyway. The branded preview rides along again as
  // visual proof, where deliverability no longer gates it.
  await deliver(d.contact_email, `Re: ${d.subject}`, d.suggested_reply,
    { companyName: d.company_name, snapshotPath: d.snapshot_path })
  db.prepare(`UPDATE reply_drafts SET status='sent', sent_at=CURRENT_TIMESTAMP WHERE id = ?`).run(d.id)
  emitEvent('feed', { msg: `follow-up sent: ${d.company_name}`, kind: 'sent' })
  emitEvent('pulse', { n: 5 })
  return { ok: true }
}

export function dismissFollowup(replyDraftId: number): boolean {
  const r = db.prepare(`UPDATE reply_drafts SET status='dismissed' WHERE id = ? AND status='pending'`).run(replyDraftId)
  return r.changes > 0
}
