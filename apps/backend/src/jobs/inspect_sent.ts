// Dev helper: show delivered emails with their compliance-stamped state.
import { db } from '../core/database.js'

const rows = db.prepare(
  `SELECT o.id, o.resend_message_id, o.sent_at, l.lead_status, l.company_name
   FROM outreach_emails o JOIN leads l ON l.id = o.lead_id
   WHERE o.sent_at IS NOT NULL ORDER BY o.sent_at DESC`,
).all()
console.log(JSON.stringify(rows, null, 2))
