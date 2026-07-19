// Dev helper: put error-failed leads back in the queue (e.g. after fixing the
// bug that killed them). Leaves legitimate business failures (no_flaws,
// suppressed, qa_exhausted) alone.
import { db } from '../core/database.js'

const n = db.prepare(
  `UPDATE leads SET lead_status = 'pending', fail_reason = NULL
   WHERE lead_status = 'failed' AND fail_reason LIKE 'error:%'`,
).run().changes
console.log(`requeued ${n} error-failed lead(s)`)
