// Dev helper: wipe pipeline state back to a clean slate (leads + drafts + ledger).
// Children before parents — better-sqlite3 v12 enforces foreign keys.
// Episodic memory is preserved (it's institutional knowledge the Dev Agent
// reads); it just loses its lead linkage since those leads are gone.
import { db } from '../core/database.js'

db.exec(`
  DELETE FROM reply_drafts;
  UPDATE episodic_memory SET lead_id = NULL;
  DELETE FROM outreach_emails;
  DELETE FROM agent_runs;
  DELETE FROM leads;
`)
console.log('Reset: leads, outreach_emails, reply_drafts, agent_runs cleared. Run `npm run seed` next.')
