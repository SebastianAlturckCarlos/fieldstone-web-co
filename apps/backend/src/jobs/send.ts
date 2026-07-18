// Outreach dispatch — compliance is enforced HERE, at the door, not upstream.
// Every send: suppression check, daily cap, unsubscribe + postal footer.
// SEND_MODE=mock stamps the DB and goes nowhere; =resend delivers for real.
import { db } from '../core/database.js'
import {
  SEND_MODE, RESEND_API_KEY, SEND_FROM, DAILY_SEND_CAP, BUSINESS_POSTAL_ADDRESS,
} from '../core/config.js'
import { emitEvent } from '../core/events.js'

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

async function deliver(to: string, subject: string, body: string): Promise<string> {
  if (SEND_MODE === 'mock') return `mock_${Date.now()}`
  if (SEND_MODE === 'resend') {
    if (!RESEND_API_KEY) throw new Error('SEND_MODE=resend requires RESEND_API_KEY')
    if (!BUSINESS_POSTAL_ADDRESS) throw new Error('Real sends require BUSINESS_POSTAL_ADDRESS (CAN-SPAM)')
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: SEND_FROM, to: [to], subject, text: body }),
    })
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
    return ((await res.json()) as any).id
  }
  throw new Error(`Unknown SEND_MODE: ${SEND_MODE}`)
}

export async function sendValidated(source = 'manual'): Promise<{ sent: number; skipped: string[] }> {
  const skipped: string[] = []
  let sent = 0

  const queue = db.prepare(
    `SELECT o.id, o.subject, o.body, l.id AS lead_id, l.company_name, l.contact_email
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
    // Suppression is checked at dispatch, never earlier — the last line of defense
    const suppressed = db.prepare(`SELECT 1 FROM suppression WHERE email = ?`).get(q.contact_email)
    if (suppressed) {
      db.prepare(`UPDATE leads SET lead_status='failed', fail_reason='suppressed' WHERE id = ?`).run(q.lead_id)
      skipped.push(`${q.company_name}: suppressed address`)
      continue
    }
    try {
      const messageId = await deliver(q.contact_email, q.subject, q.body + complianceFooter())
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
