import 'dotenv/config'

// AGENT_MODE decides who does the thinking and who (if anyone) gets billed:
//   dry-run     canned outputs, no network, $0            <- default
//   claude-code shells out to local `claude -p` — runs on the Claude
//               subscription; hits its usage limit and STOPS, never bills
//   api         Anthropic API key, pay-per-token — requires the explicit
//               double opt-in below so it can never happen by accident
export const AGENT_MODE = process.env.AGENT_MODE ?? 'dry-run'

export const ALLOW_PAID_API = process.env.ALLOW_PAID_API === 'true'
export const DAILY_TOKEN_BUDGET_USD = Number(process.env.DAILY_TOKEN_BUDGET_USD ?? 5)
export const PER_LEAD_BUDGET_USD = Number(process.env.PER_LEAD_BUDGET_USD ?? 0.25)
export const QA_THRESHOLD = Number(process.env.QA_THRESHOLD ?? 80)

// Autonomy: the server ticks itself whenever leads are pending.
// AUTO_TICK=false turns it off; interval defaults to 60s.
export const AUTO_TICK = process.env.AUTO_TICK !== 'false'
export const AUTO_TICK_MS = Number(process.env.AUTO_TICK_MS ?? 60_000)

// Outreach (Sprint 3). SEND_MODE=mock delivers nowhere — it stamps the email
// as sent in the DB so the whole pipeline is testable at $0. SEND_MODE=resend
// requires RESEND_API_KEY + BUSINESS_POSTAL_ADDRESS and sends for real.
export const SEND_MODE = process.env.SEND_MODE ?? 'mock'
export const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
export const SEND_FROM = process.env.SEND_FROM ?? 'sebastian@mail.fieldstone-webco.com'
export const DAILY_SEND_CAP = Number(process.env.DAILY_SEND_CAP ?? 10)
export const BUSINESS_POSTAL_ADDRESS = process.env.BUSINESS_POSTAL_ADDRESS ?? ''
// Where the personalized demo pages live (the marketing site, custom domain —
// the old github.io/fieldstone-web-co URLs 301-redirect here)
export const SITE_BASE = process.env.SITE_BASE ?? 'https://fieldstone-webco.com'
// Replies land here until real inbound exists on mail.fieldstone-webco.com
// (the subdomain has no MX record — without a Reply-To, replies bounce).
export const REPLY_TO = process.env.REPLY_TO ?? ''
export const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434'

// $/MTok used ONLY to estimate api-mode spend for the budget caps.
// Verify against https://platform.claude.com/docs/en/pricing before enabling
// api mode — rates drift, and the cap is only as honest as this table.
export const RATES_PER_MTOK: Record<string, { input: number; output: number }> = {
  'claude-sonnet-5': { input: 3, output: 15 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
}
