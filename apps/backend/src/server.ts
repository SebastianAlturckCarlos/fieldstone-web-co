// Live-data bridge for the dashboard. Plain node:http — no framework needed
// for four endpoints on localhost.
import http from 'node:http'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db } from './core/database.js'
import { spentToday } from './core/ledger.js'
import { AGENT_MODE, AUTO_TICK, AUTO_TICK_MS, DAILY_TOKEN_BUDGET_USD } from './core/config.js'
import { emitEvent, onEvent } from './core/events.js'
import { tick } from './core/orchestrator.js'
import { BudgetExceeded } from './core/ledger.js'
import { sendValidated, sendPausedReason } from './jobs/send.js'
import { classifyReply, recordEngagement, resumeSends, sendFollowup, dismissFollowup } from './jobs/replies.js'
import { runDigest } from './jobs/digest.js'
import { runDevAgentCycle } from './jobs/dev_agent.js'

function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', c => { raw += c; if (raw.length > 1_000_000) reject(new Error('body too large')) })
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}) } catch { reject(new Error('invalid JSON body')) } })
    req.on('error', reject)
  })
}

const PORT = Number(process.env.DASHBOARD_API_PORT ?? 4600)
const here = path.dirname(fileURLToPath(import.meta.url))
const profiles = JSON.parse(readFileSync(path.join(here, '../config/profiles.json'), 'utf-8'))

const AGENTS = [
  ['ceo_agent', 'CEO', 'Quality gate — scores every draft against the rubric'],
  ['researcher_agent', 'RES', 'Audits prospect websites for costly flaws'],
  ['cmo_agent', 'CMO', 'Writes the outreach copy from audit briefs'],
  ['sales_rep_agent', 'SLS', 'Classifies replies, flags hot leads'],
  ['analytics_agent', 'ANL', 'Daily digest: funnel, spend, anomalies'],
  ['dev_agent', 'DEV', 'Builds new skills when agents hit capability gaps'],
] as const

let tickRunning = false

async function runTickGuarded(source: string): Promise<{ ok: boolean; paused?: string; error?: string }> {
  if (tickRunning) return { ok: false, error: 'tick already running' }
  tickRunning = true
  emitEvent('feed', { msg: `tick started (${source})`, kind: 'system' })
  try {
    await tick()
    emitEvent('feed', { msg: 'tick complete', kind: 'system' })
    return { ok: true }
  } catch (err) {
    if (err instanceof BudgetExceeded) {
      emitEvent('alert', { msg: err.message })
      emitEvent('feed', { msg: `BUDGET PAUSE: ${err.message}`, kind: 'alert' })
      return { ok: false, paused: err.message }
    }
    emitEvent('feed', { msg: `tick error: ${(err as Error).message}`, kind: 'alert' })
    return { ok: false, error: (err as Error).message }
  } finally {
    tickRunning = false
  }
}

function getState() {
  const lastRuns = db.prepare(
    `SELECT agent_id, MAX(ran_at) AS last FROM agent_runs GROUP BY agent_id`,
  ).all() as { agent_id: string; last: string }[]
  const lastBy = Object.fromEntries(lastRuns.map(r => [r.agent_id, r.last + 'Z']))

  const roster = AGENTS.map(([id, label, role]) => ({
    id, label, role,
    lastRunAt: lastBy[id] ?? null,
    status: tickRunning && ['ceo_agent', 'researcher_agent', 'cmo_agent'].includes(id) ? 'run'
      : lastBy[id] && Date.now() - Date.parse(lastBy[id]) < 120_000 ? 'run' : 'idle',
  }))

  const funnel: Record<string, number> = {
    pending: 0, processing: 0, audited: 0, drafted: 0, validated: 0, sent: 0, converted: 0, failed: 0,
  }
  for (const r of db.prepare(`SELECT lead_status s, COUNT(*) n FROM leads GROUP BY s`).all() as any[])
    funnel[r.s] = r.n

  const approvals = (db.prepare(
    `SELECT o.id, o.lead_id, o.subject, o.body, o.qa_score, l.company_name, l.trade, l.city, l.audit_json
     FROM outreach_emails o JOIN leads l ON l.id = o.lead_id
     WHERE o.approved_by IS NULL AND o.sent_at IS NULL AND l.lead_status = 'drafted'
     ORDER BY o.created_at`,
  ).all() as any[]).map(a => {
    let flaws: any[] = []
    try { flaws = (JSON.parse(a.audit_json ?? '{}').flaws ?? []).map((f: any) => ({ type: f.type, severity: f.severity, detail: f.detail })) } catch {}
    const { audit_json, ...rest } = a
    return { ...rest, flaws }
  })

  const today = db.prepare(
    `SELECT SUM(input_tokens) tin, SUM(output_tokens) tout, COUNT(*) runs
     FROM agent_runs WHERE date(ran_at) = date('now')`,
  ).get() as any

  // Pending follow-up drafts — the reply-side approval queue
  const replyQueue = db.prepare(
    `SELECT rd.id, rd.outreach_id, rd.reply_text, rd.sentiment, rd.intent, rd.urgency,
            rd.action, rd.suggested_reply, rd.created_at, l.company_name, l.trade
     FROM reply_drafts rd JOIN leads l ON l.id = rd.lead_id
     WHERE rd.status = 'pending' AND rd.suggested_reply IS NOT NULL
     ORDER BY rd.urgency DESC, rd.created_at`,
  ).all()

  return {
    mode: AGENT_MODE,
    roster, funnel, approvals, replyQueue,
    sendPaused: sendPausedReason(),
    spend: { today: spentToday(), cap: DAILY_TOKEN_BUDGET_USD },
    tokens: { input: today.tin ?? 0, output: today.tout ?? 0, runs: today.runs ?? 0 },
    tickRunning,
    autoTick: { enabled: AUTO_TICK, intervalMs: AUTO_TICK_MS },
  }
}

// Pipeline screen: the 5 funnel stages with stage-to-stage conversion, plus
// the dense lead table.
function getPipeline() {
  const counts: Record<string, number> = {}
  for (const r of db.prepare(`SELECT lead_status s, COUNT(*) n FROM leads GROUP BY s`).all() as any[])
    counts[r.s] = r.n
  const reached = (stages: string[]) => stages.reduce((a, s) => a + (counts[s] ?? 0), 0)
  // "Reached stage X" = currently at X or anywhere past it
  const stageOrder = ['pending', 'audited', 'drafted', 'sent', 'converted']
  const past: Record<string, string[]> = {
    pending: ['pending', 'processing', 'audited', 'drafted', 'validated', 'sent', 'converted'],
    audited: ['audited', 'drafted', 'validated', 'sent', 'converted'],
    drafted: ['drafted', 'validated', 'sent', 'converted'],
    sent: ['sent', 'converted'],
    converted: ['converted'],
  }
  const funnel = stageOrder.map(s => ({ stage: s, reached: reached(past[s]) }))
  const withConversion = funnel.map((f, i) => ({
    ...f,
    conversionFromPrev: i === 0 || funnel[i - 1].reached === 0
      ? null
      : Math.round((f.reached / funnel[i - 1].reached) * 100),
  }))

  const leads = db.prepare(
    `SELECT l.id, l.company_name, l.trade, l.city, l.lead_status, l.fail_reason, l.updated_at,
            o.id AS outreach_id, o.qa_score, o.sent_at, o.opened_at, o.reply_sentiment
     FROM leads l
     LEFT JOIN outreach_emails o ON o.id = (
       SELECT id FROM outreach_emails WHERE lead_id = l.id ORDER BY id DESC LIMIT 1
     )
     ORDER BY l.updated_at DESC`,
  ).all()

  return { funnel: withConversion, leads, sendPaused: sendPausedReason() }
}

function getAgentDetail(id: string) {
  const meta = AGENTS.find(a => a[0] === id)
  if (!meta) return null
  const p = profiles[id] ?? {}
  const totals = db.prepare(
    `SELECT COUNT(*) runs, COALESCE(SUM(input_tokens),0) tin, COALESCE(SUM(output_tokens),0) tout,
            COALESCE(SUM(est_cost_usd),0) cost, COALESCE(AVG(duration_ms),0) avg_ms
     FROM agent_runs WHERE agent_id = ?`,
  ).get(id) as any
  const recent = db.prepare(
    `SELECT r.ran_at, r.model, r.mode, r.input_tokens, r.output_tokens, r.duration_ms, l.company_name
     FROM agent_runs r LEFT JOIN leads l ON l.id = r.lead_id
     WHERE r.agent_id = ? ORDER BY r.id DESC LIMIT 20`,
  ).all(id)
  // The CEO's verdict history — every draft it scored, and what happened next
  const verdicts = id === 'ceo_agent'
    ? db.prepare(
        `SELECT o.qa_score, o.approved_by, o.subject, l.company_name, o.created_at
         FROM outreach_emails o JOIN leads l ON l.id = o.lead_id
         ORDER BY o.id DESC LIMIT 10`,
      ).all()
    : []

  return {
    id, label: meta[1], role: meta[2],
    provider: p.provider ?? 'n/a', model: p.model ?? 'n/a',
    system: p.system ?? '',
    totals, recent, verdicts,
  }
}

const TIER1_PRICE = 399
const MILESTONES = [
  { name: 'M1 — engine validated', mrr: 1995 },
  { name: 'M2 — quit-rate revenue', mrr: 5589 },
  { name: 'M3 — first delivery hire', mrr: 10783 },
]

function getGrowth() {
  const converted = (db.prepare(`SELECT COUNT(*) n FROM leads WHERE lead_status='converted'`).get() as any).n
  const mrr = converted * TIER1_PRICE

  const funnel: Record<string, number> = {}
  for (const r of db.prepare(`SELECT lead_status s, COUNT(*) n FROM leads GROUP BY s`).all() as any[])
    funnel[r.s] = r.n
  const total = Object.values(funnel).reduce((a, b) => a + b, 0)

  const byDay = db.prepare(
    `SELECT date(ran_at) day, SUM(input_tokens + output_tokens) tokens,
            COUNT(*) runs, SUM(est_cost_usd) cost
     FROM agent_runs GROUP BY date(ran_at) ORDER BY day DESC LIMIT 14`,
  ).all().reverse()

  const digest = db.prepare(
    `SELECT day, digest_md FROM daily_metrics ORDER BY day DESC LIMIT 1`,
  ).get() ?? null

  const skills = db.prepare(
    `SELECT id, skill_name, description, status, code_body, created_at FROM system_skills ORDER BY created_at DESC`,
  ).all()

  return { mrr, converted, tier1Price: TIER1_PRICE, milestones: MILESTONES, funnel, total, byDay, digest, skills }
}

function json(res: http.ServerResponse, code: number, body: any) {
  res.writeHead(code, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

const server = http.createServer(async (req, res) => {
  // Dashboard dev server runs on another port — allow it.
  res.setHeader('access-control-allow-origin', '*')
  res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

  if (req.method === 'GET' && url.pathname === '/api/state') return json(res, 200, getState())

  const agentMatch = url.pathname.match(/^\/api\/agents\/(\w+)$/)
  if (req.method === 'GET' && agentMatch) {
    const detail = getAgentDetail(agentMatch[1])
    return detail ? json(res, 200, detail) : json(res, 404, { error: 'unknown agent' })
  }

  if (req.method === 'GET' && url.pathname === '/api/events') {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    })
    res.write(': connected\n\n')
    const off = onEvent(e => res.write(`data: ${JSON.stringify(e)}\n\n`))
    const heartbeat = setInterval(() => res.write(': hb\n\n'), 25_000)
    req.on('close', () => { off(); clearInterval(heartbeat) })
    return
  }

  const approve = url.pathname.match(/^\/api\/(approve|reject)\/(\d+)$/)
  if (req.method === 'POST' && approve) {
    const [, action, id] = approve
    const draft = db.prepare(
      `SELECT o.id, o.lead_id, l.company_name FROM outreach_emails o
       JOIN leads l ON l.id = o.lead_id WHERE o.id = ? AND o.approved_by IS NULL`,
    ).get(Number(id)) as any
    if (!draft) return json(res, 404, { error: 'draft not found or already handled' })

    if (action === 'approve') {
      db.prepare(`UPDATE outreach_emails SET approved_by = 'human' WHERE id = ?`).run(draft.id)
      db.prepare(`UPDATE leads SET lead_status = 'validated', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(draft.lead_id)
      emitEvent('feed', { msg: `approved: ${draft.company_name}`, kind: 'approve' })
      emitEvent('pulse', { n: 5 })
    } else {
      db.prepare(`UPDATE outreach_emails SET approved_by = 'human_rejected' WHERE id = ?`).run(draft.id)
      db.prepare(`UPDATE leads SET lead_status = 'failed', fail_reason = 'human_rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(draft.lead_id)
      emitEvent('feed', { msg: `rejected: ${draft.company_name}`, kind: 'reject' })
    }
    return json(res, 200, { ok: true, state: getState() })
  }

  if (req.method === 'POST' && url.pathname === '/api/tick') {
    const result = await runTickGuarded('manual')
    if (result.error === 'tick already running') return json(res, 409, result)
    return json(res, result.error ? 500 : 200, { ...result, state: getState() })
  }

  if (req.method === 'POST' && url.pathname === '/api/send') {
    const result = await sendValidated('manual')
    return json(res, 200, { ...result, state: getState() })
  }

  if (req.method === 'GET' && url.pathname === '/api/growth') return json(res, 200, getGrowth())

  if (req.method === 'GET' && url.pathname === '/api/pipeline') return json(res, 200, getPipeline())

  // A reply pasted into the dashboard (works today, no public URL needed)
  const replyMatch = url.pathname.match(/^\/api\/replies\/(\d+)$/)
  if (req.method === 'POST' && replyMatch) {
    try {
      const body = await readBody(req)
      if (!body.text?.trim()) return json(res, 400, { error: 'expected { text: "the reply" }' })
      const result = await classifyReply(Number(replyMatch[1]), body.text.trim(), 'dashboard')
      return json(res, 200, { ok: true, classification: result, state: getState() })
    } catch (err) {
      return json(res, 400, { error: (err as Error).message })
    }
  }

  // Resend webhook receiver — wire this URL (tunneled) into the Resend
  // dashboard when opens/bounces tracking goes live. Engagement events update
  // the DB; inbound replies (email.received) classify automatically.
  if (req.method === 'POST' && url.pathname === '/api/webhooks/resend') {
    try {
      const event = await readBody(req)
      const type: string = event.type ?? ''
      if (type.startsWith('email.')) {
        const kind = type.replace('email.', '')  // delivered|opened|bounced|complained
        const matched = recordEngagement(event.data?.email_id ?? '', kind)
        return json(res, 200, { ok: true, matched })
      }
      return json(res, 200, { ok: true, ignored: type })
    } catch (err) {
      return json(res, 400, { error: (err as Error).message })
    }
  }

  const followupMatch = url.pathname.match(/^\/api\/followups\/(\d+)\/(send|dismiss)$/)
  if (req.method === 'POST' && followupMatch) {
    const [, id, action] = followupMatch
    if (action === 'dismiss')
      return json(res, 200, { ok: dismissFollowup(Number(id)), state: getState() })
    const result = await sendFollowup(Number(id))
    return json(res, result.ok ? 200 : 400, { ...result, state: getState() })
  }

  if (req.method === 'POST' && url.pathname === '/api/send/resume') {
    resumeSends()
    return json(res, 200, { ok: true, state: getState() })
  }

  if (req.method === 'POST' && url.pathname === '/api/digest') {
    const result = await runDigest('manual')
    return json(res, 200, result)
  }

  if (req.method === 'POST' && url.pathname === '/api/dev-agent/run') {
    const result = await runDevAgentCycle('manual')
    return json(res, 200, result)
  }

  const skillMatch = url.pathname.match(/^\/api\/skills\/([\w-]+)\/(approve|disable)$/)
  if (req.method === 'POST' && skillMatch) {
    const [, skillId, action] = skillMatch
    const status = action === 'approve' ? 'active' : 'disabled'
    const r = db.prepare(`UPDATE system_skills SET status = ? WHERE id = ?`).run(status, skillId)
    if (!r.changes) return json(res, 404, { error: 'unknown skill' })
    emitEvent('feed', { msg: `skill ${action === 'approve' ? 'activated' : 'disabled'}: ${skillId}`, kind: 'system' })
    return json(res, 200, { ok: true })
  }

  json(res, 404, { error: 'not found' })
})

server.listen(PORT, () => {
  console.log(`Fieldstone engine API on http://localhost:${PORT} (mode: ${AGENT_MODE})`)
  if (AUTO_TICK) {
    console.log(`Auto-tick every ${AUTO_TICK_MS / 1000}s — agents run themselves; the human only approves.`)
    setInterval(async () => {
      if (tickRunning) return
      const pending = (db.prepare(`SELECT COUNT(*) n FROM leads WHERE lead_status = 'pending'`).get() as any).n
      if (pending > 0) await runTickGuarded('auto')
      // Human-approved emails go out automatically (mock stamps DB; real mode
      // respects the daily cap + jitter + suppression inside sendValidated)
      const validated = (db.prepare(`SELECT COUNT(*) n FROM leads WHERE lead_status = 'validated'`).get() as any).n
      if (validated > 0) await sendValidated('auto')
    }, AUTO_TICK_MS)

    // 18:00 digest — checked hourly, runs once per day
    setInterval(async () => {
      const day = new Date().toISOString().slice(0, 10)
      const done = db.prepare(`SELECT 1 FROM daily_metrics WHERE day = ?`).get(day)
      if (!done && new Date().getHours() >= 18) await runDigest('scheduled')
    }, 60 * 60 * 1000)

    // Dev Agent: weekly per the blueprint's Sunday cadence, checked hourly
    setInterval(async () => {
      if (new Date().getDay() !== 0) return // Sunday only
      const today = new Date().toISOString().slice(0, 10)
      const alreadyRan = db.prepare(
        `SELECT 1 FROM system_skills WHERE date(created_at) = ?`,
      ).get(today)
      if (!alreadyRan) await runDevAgentCycle('scheduled')
    }, 60 * 60 * 1000)
  }
})
