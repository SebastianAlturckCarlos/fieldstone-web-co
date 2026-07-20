// Outreach dispatch — compliance is enforced HERE, at the door, not upstream.
// Every send: suppression check, daily cap, unsubscribe + postal footer.
// SEND_MODE=mock stamps the DB and goes nowhere; =resend delivers for real.
import { readFileSync, existsSync } from 'node:fs'
import { db } from '../core/database.js'
import {
  AGENT_MODE, SEND_MODE, RESEND_API_KEY, SEND_FROM, DAILY_SEND_CAP, BUSINESS_POSTAL_ADDRESS, REPLY_TO,
} from '../core/config.js'
import { emitEvent } from '../core/events.js'

// Reserved/test domains (RFC 2606 + our seed data) — a real send to these
// hard-bounces and dings sender reputation for nothing.
export function isTestAddress(email: string): boolean {
  return /@([\w.-]+\.)?example\.(com|org|net)$|\.(test|invalid|localhost)$/i.test(email)
}

export function sendPausedReason(): string | null {
  const row = db.prepare(`SELECT v FROM kv WHERE k = 'send_paused'`).get() as any
  return row?.v ?? null
}

function complianceFooter(): string {
  const address = BUSINESS_POSTAL_ADDRESS ||
    (SEND_MODE === 'mock' ? '[postal address placeholder — required before real sends]' : '')
  return `\n\n—\nFieldstone Web Co · ${address}\nDon't want to hear from me again? Just reply "stop" and you never will.`
}

function sentToday(): number {
  return (db.prepare(
    `SELECT COUNT(*) n FROM outreach_emails WHERE date(sent_at) = date('now')`,
  ).get() as any).n
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// HTML alternative body: the drafted prose verbatim, then the branded mockup
// snapshot inline (referenced by CID), then the same compliance footer the
// text part carries. Deliberately minimal markup — cold email that looks
// designed gets filtered; this should look like a person attached a picture.
function renderHtmlBody(body: string, companyName: string, hasSnapshot: boolean): string {
  const paragraphs = body.trim().split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 14px 0;">${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n')
  const image = hasSnapshot
    ? `<div style="margin:18px 0 6px 0;">
        <img src="cid:fieldstone-preview" alt="Preview of ${esc(companyName)}'s operations screen, in your branding"
             width="560" style="max-width:100%;border:1px solid #e2e8f0;border-radius:10px;display:block;">
        <p style="margin:6px 0 0 0;font-size:12px;color:#64748b;">Built from your site — your colors, your logo. Sample data.</p>
      </div>`
    : ''
  const address = BUSINESS_POSTAL_ADDRESS ||
    (SEND_MODE === 'mock' ? '[postal address placeholder — required before real sends]' : '')
  return `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.55;color:#1a202c;max-width:640px;">
${paragraphs}
${image}
<p style="margin:22px 0 0 0;font-size:12px;color:#94a3b8;">—<br>Fieldstone Web Co · ${esc(address)}<br>Don't want to hear from me again? Just reply &quot;stop&quot; and you never will.</p>
</div>`
}

export interface DeliverOptions {
  companyName?: string
  snapshotPath?: string | null   // PNG on disk -> embedded via CID attachment
}

export async function deliver(to: string, subject: string, body: string, opts: DeliverOptions = {}): Promise<string> {
  if (SEND_MODE === 'mock') return `mock_${Date.now()}`
  if (SEND_MODE === 'resend') {
    if (!RESEND_API_KEY) throw new Error('SEND_MODE=resend requires RESEND_API_KEY')
    if (!BUSINESS_POSTAL_ADDRESS) throw new Error('Real sends require BUSINESS_POSTAL_ADDRESS (CAN-SPAM)')
    const hasSnapshot = !!(opts.snapshotPath && existsSync(opts.snapshotPath))
    // body arrives WITHOUT the footer; each alternative part appends its own
    // (text gets the plain footer, html renders it styled) — never both.
    const payload: any = {
      from: SEND_FROM, to: [to], subject,
      text: body + complianceFooter(),
      html: renderHtmlBody(body, opts.companyName ?? 'your company', hasSnapshot),
      ...(REPLY_TO ? { reply_to: REPLY_TO } : {}),
    }
    if (hasSnapshot) {
      payload.attachments = [{
        filename: 'your-preview.png',
        content: readFileSync(opts.snapshotPath!).toString('base64'),
        content_id: 'fieldstone-preview',
      }]
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
    return ((await res.json()) as any).id
  }
  throw new Error(`Unknown SEND_MODE: ${SEND_MODE}`)
}

export async function sendValidated(source = 'manual'): Promise<{ sent: number; skipped: string[] }> {
  const skipped: string[] = []
  let sent = 0

  // Bounce-spike circuit breaker (set by the reply/engagement job) — nothing
  // real goes out until a human clears it via POST /api/send/resume.
  const paused = sendPausedReason()
  if (paused && SEND_MODE !== 'mock') {
    emitEvent('feed', { msg: `sends paused: ${paused}`, kind: 'alert' })
    return { sent: 0, skipped: [`sends paused: ${paused}`] }
  }

  // Canned dry-run copy must never reach a real inbox: the drafts contain
  // template flaws that are fiction for any real company. Real delivery
  // requires a real brain (claude-code or api mode) behind the drafts.
  if (SEND_MODE === 'resend' && AGENT_MODE === 'dry-run') {
    const msg = 'refusing real delivery of dry-run (canned) drafts — set AGENT_MODE=claude-code for real copy'
    emitEvent('feed', { msg, kind: 'alert' })
    return { sent: 0, skipped: [msg] }
  }

  const queue = db.prepare(
    `SELECT o.id, o.subject, o.body, o.snapshot_path, l.id AS lead_id, l.company_name, l.contact_email
     FROM outreach_emails o JOIN leads l ON l.id = o.lead_id
     WHERE l.lead_status = 'validated' AND o.approved_by = 'human' AND o.sent_at IS NULL
     ORDER BY o.created_at`,
  ).all() as any[]

  for (const q of queue) {
    if (sentToday() >= DAILY_SEND_CAP) {
      skipped.push(`daily send cap (${DAILY_SEND_CAP}) reached — remaining queue holds until tomorrow`)
      emitEvent('feed', { msg: `send cap ${DAILY_SEND_CAP}/day reached — queue held`, kind: 'alert' })
      break
    }
    // Seed/test addresses hard-bounce — never let one near the real API
    if (SEND_MODE === 'resend' && isTestAddress(q.contact_email)) {
      db.prepare(`UPDATE leads SET lead_status='failed', fail_reason='test_address', updated_at=CURRENT_TIMESTAMP WHERE id = ?`).run(q.lead_id)
      skipped.push(`${q.company_name}: test/example address — not sendable`)
      continue
    }
    // Suppression is checked at dispatch, never earlier — the last line of defense
    const suppressed = db.prepare(`SELECT 1 FROM suppression WHERE email = ?`).get(q.contact_email)
    if (suppressed) {
      db.prepare(`UPDATE leads SET lead_status='failed', fail_reason='suppressed' WHERE id = ?`).run(q.lead_id)
      skipped.push(`${q.company_name}: suppressed address`)
      continue
    }
    try {
      const messageId = await deliver(q.contact_email, q.subject, q.body,
        { companyName: q.company_name, snapshotPath: q.snapshot_path })
      db.prepare(`UPDATE outreach_emails SET sent_at = CURRENT_TIMESTAMP, resend_message_id = ? WHERE id = ?`)
        .run(messageId, q.id)
      db.prepare(`UPDATE leads SET lead_status = 'sent', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(q.lead_id)
      sent++
      emitEvent('feed', { msg: `sent (${SEND_MODE}): ${q.company_name}`, kind: 'sent' })
      emitEvent('pulse', { n: 6 })
      // Jitter between real sends so delivery never looks like a burst
      if (SEND_MODE !== 'mock') await new Promise(r => setTimeout(r, 20_000 + Math.random() * 40_000))
    } catch (err) {
      skipped.push(`${q.company_name}: ${(err as Error).message}`)
      emitEvent('feed', { msg: `send failed: ${q.company_name}`, kind: 'alert' })
    }
  }
  if (sent > 0) console.log(`[send:${source}] delivered ${sent}, skipped ${skipped.length}`)
  return { sent, skipped }
}
