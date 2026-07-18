import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AGENT_MODE, ALLOW_PAID_API, OLLAMA_URL, QA_THRESHOLD } from '../core/config.js'
import { recordRun } from '../core/ledger.js'
import { mockAgent } from './mocks.js'

const execFileAsync = promisify(execFile)
const here = path.dirname(fileURLToPath(import.meta.url))
const profiles = JSON.parse(readFileSync(path.join(here, '../../config/profiles.json'), 'utf-8'))

function interpolate(system: string, vars: Record<string, string>): string {
  return system.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)
}

// Parse the CEO's "APPROVE 88 / REJECT 64 + feedback" text protocol
function parseCeoVerdict(text: string) {
  const m = text.trim().match(/^(APPROVE|REJECT)\s+(\d+)\s*([\s\S]*)$/)
  if (!m) throw new Error(`CEO verdict unparseable: ${text.slice(0, 80)}`)
  return { approved: m[1] === 'APPROVE', score: Number(m[2]), feedback: m[3].trim() }
}

export async function runAgent(agentId: string, payload: any, leadId?: string): Promise<any> {
  const p = profiles[agentId]
  if (!p) throw new Error(`Unknown agent ${agentId}`)
  const started = Date.now()

  // ---- dry-run: canned outputs, zero network, zero dollars ----
  if (AGENT_MODE === 'dry-run') {
    const { output, inputTokens, outputTokens } = mockAgent(agentId, payload)
    recordRun(agentId, 'mock', 'dry-run', inputTokens, outputTokens, Date.now() - started, leadId)
    return output
  }

  // ---- researcher always routes to local Ollama outside dry-run ----
  if (p.provider === 'ollama') {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      body: JSON.stringify({
        model: p.model, stream: false, format: 'json',
        messages: [
          { role: 'system', content: p.system },
          { role: 'user', content: JSON.stringify(payload) },
        ],
      }),
    }).then(r => r.json()) as any
    recordRun(agentId, p.model, 'ollama', 0, 0, Date.now() - started, leadId)
    return JSON.parse(res.message.content)
  }

  const system = interpolate(p.system, {
    qa_threshold: String(QA_THRESHOLD),
    demo_link: process.env.DEMO_LINK ?? '',
    calendar_link: process.env.CALENDAR_LINK ?? '',
  })

  // ---- claude-code: headless `claude -p` on the SUBSCRIPTION ----
  // Costs nothing extra; when the subscription's usage limit is hit the CLI
  // errors out and the orchestrator pauses — it can never surprise-bill.
  if (AGENT_MODE === 'claude-code') {
    const prompt = `${system}\n\n---\nInput payload:\n${JSON.stringify(payload)}`
    const { stdout } = await execFileAsync(
      'claude', ['-p', prompt, '--output-format', 'json', '--model', p.model],
      { timeout: 180_000, maxBuffer: 10 * 1024 * 1024, shell: true },
    )
    const wrapper = JSON.parse(stdout)
    recordRun(agentId, p.model, 'claude-code',
      wrapper.usage?.input_tokens ?? 0, wrapper.usage?.output_tokens ?? 0,
      Date.now() - started, leadId)
    return parseAgentOutput(agentId, wrapper.result)
  }

  // ---- api: pay-per-token. Hard double opt-in so it can't happen by accident ----
  if (AGENT_MODE === 'api') {
    if (!ALLOW_PAID_API || !process.env.ANTHROPIC_API_KEY)
      throw new Error('api mode requires BOTH ALLOW_PAID_API=true and ANTHROPIC_API_KEY. ' +
        'This mode bills per token — use AGENT_MODE=claude-code to stay on the subscription.')
    const { default: Anthropic } = await import('@anthropic-ai/sdk' as string)
    const client = new Anthropic()
    const msg = await client.messages.create({
      model: p.model, max_tokens: p.max_tokens,
      system,
      messages: [{ role: 'user', content: JSON.stringify(payload) }],
    })
    recordRun(agentId, p.model, 'api', msg.usage.input_tokens, msg.usage.output_tokens,
      Date.now() - started, leadId)
    return parseAgentOutput(agentId, msg.content.find((b: any) => b.type === 'text')?.text ?? '')
  }

  throw new Error(`Unknown AGENT_MODE: ${AGENT_MODE}`)
}

function parseAgentOutput(agentId: string, text: string): any {
  if (agentId === 'ceo_agent') return parseCeoVerdict(text)
  if (agentId === 'analytics_agent') return text // digest is markdown, not JSON
  if (agentId === 'dev_agent') return text // raw .ts source, or "NEEDS_HUMAN ..."
  // Other agents speak JSON; tolerate a fenced code block
  const cleaned = text.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  return JSON.parse(cleaned)
}
