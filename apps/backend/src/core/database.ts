import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..') // apps/backend

export const db = new Database(path.join(root, 'local_engine.db'))
db.pragma('journal_mode = WAL')
db.exec(readFileSync(path.join(root, 'schema.sql'), 'utf-8'))

// Column migrations for databases created before the column existed —
// CREATE TABLE IF NOT EXISTS never alters an existing table.
function ensureColumn(table: string, column: string, ddl: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
  if (!cols.some(c => c.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`)
}
ensureColumn('outreach_emails', 'consult_json', 'consult_json TEXT')
ensureColumn('outreach_emails', 'snapshot_path', 'snapshot_path TEXT')
ensureColumn('leads', 'brand_json', 'brand_json TEXT')
