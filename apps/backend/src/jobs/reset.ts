// Dev helper: wipe pipeline state back to a clean slate (leads + drafts + ledger).
import { db } from '../core/database.js'

db.exec(`DELETE FROM outreach_emails; DELETE FROM agent_runs; DELETE FROM leads;`)
console.log('Reset: leads, outreach_emails, agent_runs cleared. Run `npm run seed` next.')
