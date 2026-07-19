// Emergency hold: any validated-but-unsent lead pointing at a seed/example
// address gets pulled back to 'drafted' before the auto-send can fire.
// Real prospect addresses are untouched.
import { db } from '../core/database.js'

const sent = db.prepare(
  `SELECT l.company_name, l.contact_email, o.sent_at, o.resend_message_id
   FROM leads l JOIN outreach_emails o ON o.lead_id = l.id
   WHERE o.sent_at IS NOT NULL ORDER BY o.id DESC`,
).all()
console.log('ALREADY SENT:', JSON.stringify(sent))

const held = db.prepare(
  `UPDATE leads SET lead_status = 'drafted', updated_at = CURRENT_TIMESTAMP
   WHERE lead_status = 'validated' AND contact_email LIKE '%example.com'`,
).run().changes
db.prepare(
  `UPDATE outreach_emails SET approved_by = NULL
   WHERE sent_at IS NULL AND approved_by = 'human'
     AND lead_id IN (SELECT id FROM leads WHERE contact_email LIKE '%example.com')`,
).run()
console.log(`HELD (validated -> drafted, example.com only): ${held}`)
