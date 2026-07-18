import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..') // apps/backend

export const db = new Database(path.join(root, 'local_engine.db'))
db.pragma('journal_mode = WAL')
db.exec(readFileSync(path.join(root, 'schema.sql'), 'utf-8'))
