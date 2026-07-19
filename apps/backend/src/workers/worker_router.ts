import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AGENT_MODE, ALLOW_PAID_API, OLLAMA_URL, QA_THRESHOLD } from '../core/config.js'
import { recordRun } from '../core/ledger.js'
import { mockAgent } from './mocks.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const profiles = JSON.parse(readFileSync(path.join(here, '../../config/profiles.json'), 'utf-8'))

// Probe Ollama at most once a minute — a dead socket shouldn't add latency
// to every single agent call.
let ollamaProbeUntil = 0
let ollamaProbeResult = false
async function ollamaUp(): Promise<boolean> {
  if (Date.now() < ollamaProbeUntil) return ollamaProbeResult
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 800)
    const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: ctrl.signal })
    clearTimeout(timer)
    ollamaProbeResult = r.ok
  } catch { ollamaProbeResult = false }
  ollamaProbeUntil = Date.now() + 60_000
  return ollamaProbeResult
}

function interpolate(system: string, vars: Record<string, string>): string {
  return system.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)
}

// Parse the CEO's "APPROVE 88 / REJECT 64 + feedback" text protocol.
// Real models sometimes write a preamble line before the verdict ("Here is my
// determination: REJECT 75 ...") — find the verdict anywhere, not just at the
// start. First VERB+score match wins; feedback is everything after it.
function parseCeoVerdict(text: string) {
  const m = text.match(/\b(APPROVE|REJECT)\s+(\d{1,3})\b\s*([\s\S]*)$/)
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

  // ---- researcher prefers local Ollama outside dry-run ($0 tokens) ----
  // If Ollama isn't installed/running on this machine, claude-code mode
  // falls through to the subscription path below — same hard-stop cost
  // model, no lead ever fails just because Qwen is absent.
  const useOllama = p.provider === 'ollama' && (AGENT_MODE !== 'claude-code' || await ollamaUp())
  if (useOllama) {
    try {
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
      // Ollama reports problems (e.g. "model not found") as {error} with no
      // message — read it as one instead of crashing on res.message.content
      if (res.error || !res.message?.content) throw new Error(`Ollama: ${res.error ?? 'unexpected /api/chat response shape'}`)
      recordRun(agentId, p.model, 'ollama', 0, 0, Date.now() - started, leadId)
      return JSON.parse(res.message.content)
    } catch (err) {
      // In claude-code mode a broken Ollama is a downgrade, not a lead killer:
      // fall through to the subscription path (haiku). Other modes rethrow.
      if (AGENT_MODE !== 'claude-code') throw err
      console.log(`  [router] Ollama failed (${(err as Error).message.slice(0, 90)}) — ${agentId} via claude-code fallback`)
    }
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
    // Ollama-profile agents falling through (no local Qwen) ride Haiku —
    // the cheap tier, per the routing discipline. Never pass an Ollama
    // model id to the claude CLI.
    const model = p.provider === 'ollama' ? 'claude-haiku-4-5-20251001' : p.model
    if (p.provider === 'ollama')
      console.log(`  [router] Ollama unreachable — ${agentId} via claude-code (${model}, subscription)`)
    const prompt = `${system}\n\n---\nInput payload:\n${JSON.stringify(payload)}`
    // The prompt travels via STDIN, never argv. Two Windows realities force
    // this: (1) npm installs `claude` as a .cmd shim, which Node can only
    // spawn with shell:true (plain execFile -> ENOENT); (2) shell:true passes
    // argv through cmd.exe UNESCAPED, shredding any prompt with quotes or
    // newlines. Static args + piped stdin sidesteps both, on every platform.
    const stdout = await new Promise<string>((resolve, reject) => {
      const child = spawn('claude', ['-p', '--output-format', 'json', '--model', model],
        { shell: true, timeout: 180_000 })
      let out = ''
      let errOut = ''
      child.stdout.on('data', d => { out += d })
      child.stderr.on('data', d => { errOut += d })
      child.on('error', reject)
      child.on('close', code => {
        if (code === 0) resolve(out)
        else reject(new Error(`claude CLI exited ${code}: ${errOut.slice(0, 300) || out.slice(0, 300)}`))
      })
      child.stdin.write(prompt)
      child.stdin.end()
    })
    const wrapper = extractJson(stdout)
    recordRun(agentId, model, 'claude-code',
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
  // Other agents speak JSON; tolerate fences and any prose around the object
  return extractJson(text)
}

// Models (and the claude CLI itself on cold start) sometimes wrap JSON in
// prose or warning lines — take the outermost {...} instead of failing.
export function extractJson(text: string): any {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  try { return JSON.parse(cleaned) } catch {}
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1))
  throw new Error(`no JSON object in output: ${cleaned.slice(0, 80)}`)
}
