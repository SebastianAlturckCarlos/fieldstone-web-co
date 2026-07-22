// The 18:00 Analytics digest: funnel + cost + anomalies -> daily_metrics row,
// the dashboard, and the Obsidian vault.
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { db } from '../core/database.js'
import { runAgent } from '../workers/worker_router.js'
import { emitEvent } from '../core/events.js'

const VAULT_DIR = 'C:\\dev\\fieldstone-workspace\\vault\\Financial Growth'

export async function runDigest(source = 'manual'): Promise<{ day: string; markdown: string }> {
  const day = new Date().toISOString().slice(0, 10)

  const funnel: Record<string, number> = {}
  for (const r of db.prepare(`SELECT lead_status s, COUNT(*) n FROM leads GROUP BY s`).all() as any[])
    funnel[r.s] = r.n

  const ledger = db.prepare(
    `SELECT COUNT(*) runs, COALESCE(SUM(input_tokens),0) tin, COALESCE(SUM(output_tokens),0) tout,
            COALESCE(SUM(est_cost_usd),0) cost
     FROM agent_runs WHERE date(ran_at) = date('now')`,
  ).get() as any

  const sentToday = (db.prepare(
    `SELECT COUNT(*) n FROM outreach_emails WHERE date(sent_at) = date('now')`,
  ).get() as any).n

  let competitors: any[] = []
  try {
    const row = db.prepare(`SELECT v FROM kv WHERE k = 'competitor_intel'`).get() as any
    if (row?.v) competitors = JSON.parse(row.v).notes ?? []
  } catch { /* absent or malformed — digest still runs without it */ }

  // The prompt asks for anomalies against "the trailing 7-day mean" — it needs
  // the trailing 7 days to do that. Previously this only ever received today's
  // numbers, so anomaly detection had no baseline to compare against at all.
  const trailing7d = db.prepare(
    `SELECT day, leads_in, audited, drafted, sent, est_spend_usd
     FROM daily_metrics WHERE day < ? ORDER BY day DESC LIMIT 7`,
  ).all(day)

  const payload = { day, funnel, ledger, sent: sentToday, opens: 0, replies: 0, competitors, trailing7d }
  const digest = await runAgent('analytics_agent', payload)
  const markdown = typeof digest === 'string' ? digest : digest.markdown

  db.prepare(
    `INSERT INTO daily_metrics (day, leads_in, audited, drafted, sent, opens, replies,
       positives, calls_booked, bounces, unsubscribes, est_spend_usd, digest_md)
     VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, ?, ?)
     ON CONFLICT(day) DO UPDATE SET sent=excluded.sent, est_spend_usd=excluded.est_spend_usd,
       digest_md=excluded.digest_md`,
  ).run(day, funnel.pending ?? 0, funnel.audited ?? 0, funnel.drafted ?? 0, sentToday, ledger.cost, markdown)

  try {
    mkdirSync(VAULT_DIR, { recursive: true })
    writeFileSync(path.join(VAULT_DIR, `${day}.md`), markdown, 'utf-8')
  } catch (err) {
    console.log(`[digest] vault write failed: ${(err as Error).message}`)
  }

  emitEvent('feed', { msg: `daily digest generated (${source})`, kind: 'system' })
  emitEvent('pulse', { n: 4 })
  console.log(`[digest:${source}] ${day} written to daily_metrics + vault`)
  return { day, markdown }
}
