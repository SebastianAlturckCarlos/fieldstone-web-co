// Institutional memory: every lead failure gets committed here with WHY it
// failed. The Dev Agent reads this before proposing a skill — it's the
// difference between "write a random skill" and "write the skill this
// business actually needs right now."
import { db } from './database.js'

export function commitEpisodicMemory(leadId: string | null, tag: string, payload: unknown) {
  db.prepare(`INSERT INTO episodic_memory (lead_id, vector_tag, memory_payload) VALUES (?, ?, ?)`)
    .run(leadId, tag, JSON.stringify(payload))
}

// Groups by the tag PREFIX before ':' (e.g. 'fail:no_flaws' -> 'fail') so
// callers can see "3 qa_reject, 2 fail" without hand-rolling SQL each time.
export function tagCounts(): Record<string, number> {
  const rows = db.prepare(`SELECT vector_tag FROM episodic_memory`).all() as { vector_tag: string }[]
  const counts: Record<string, number> = {}
  for (const r of rows) counts[r.vector_tag] = (counts[r.vector_tag] ?? 0) + 1
  return counts
}

export function recentMemory(tag?: string, limit = 20) {
  return tag
    ? db.prepare(`SELECT * FROM episodic_memory WHERE vector_tag = ? ORDER BY id DESC LIMIT ?`).all(tag, limit)
    : db.prepare(`SELECT * FROM episodic_memory ORDER BY id DESC LIMIT ?`).all(limit)
}

export function registerNewSkill(name: string, desc: string, filePath: string, code: string) {
  const id = `skill_${name}_${Date.now()}`
  db.prepare(
    `INSERT INTO system_skills (id, skill_name, description, file_path, code_body, status)
     VALUES (?, ?, ?, ?, ?, 'pending_review')`,
  ).run(id, name, desc, filePath, code)
  return id
}
