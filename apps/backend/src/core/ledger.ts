import { db } from './database.js'
import { DAILY_TOKEN_BUDGET_USD, PER_LEAD_BUDGET_USD, RATES_PER_MTOK } from './config.js'

export class BudgetExceeded extends Error {}

export function estimateCost(model: string, mode: string, inTok: number, outTok: number): number {
  if (mode !== 'api') return 0 // dry-run, claude-code, ollama: no per-token billing
  const r = RATES_PER_MTOK[model]
  if (!r) throw new Error(`No rate table entry for model ${model} — refusing to spend blind`)
  return (inTok * r.input + outTok * r.output) / 1_000_000
}

export function recordRun(
  agentId: string, model: string, mode: string,
  inputTokens: number, outputTokens: number, durationMs: number, leadId?: string,
) {
  const cost = estimateCost(model, mode, inputTokens, outputTokens)
  db.prepare(`INSERT INTO agent_runs (agent_id, model, mode, input_tokens, output_tokens, est_cost_usd, duration_ms, lead_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(agentId, model, mode, inputTokens, outputTokens, cost, durationMs, leadId ?? null)
}

export function spentToday(): number {
  const row = db.prepare(
    `SELECT COALESCE(SUM(est_cost_usd), 0) AS spend FROM agent_runs WHERE date(ran_at) = date('now')`,
  ).get() as { spend: number }
  return row.spend
}

export function spentOnLead(leadId: string): number {
  const row = db.prepare(
    `SELECT COALESCE(SUM(est_cost_usd), 0) AS spend FROM agent_runs WHERE lead_id = ?`,
  ).get(leadId) as { spend: number }
  return row.spend
}

export function assertUnderBudget() {
  const spend = spentToday()
  if (spend >= DAILY_TOKEN_BUDGET_USD)
    throw new BudgetExceeded(`Daily budget hit: $${spend.toFixed(2)} >= $${DAILY_TOKEN_BUDGET_USD}`)
}

export function assertLeadUnderBudget(leadId: string) {
  const spend = spentOnLead(leadId)
  if (spend >= PER_LEAD_BUDGET_USD)
    throw new BudgetExceeded(`Per-lead budget hit for ${leadId}: $${spend.toFixed(3)}`)
}
