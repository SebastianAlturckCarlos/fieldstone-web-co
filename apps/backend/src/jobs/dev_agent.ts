// The Dev Agent, for real: it reads institutional memory (episodic_memory —
// every lead failure and every QA rejection, committed as they happen),
// decides whether the business actually has an unmet capability, and if so
// asks the Dev Agent profile to write a real .ts skill file addressing it.
// The file lands on disk under skills/auto_gen/ AND in system_skills as
// pending_review — nothing executes until a human reads and approves it
// (base_skill.ts contract: capability injection, no ambient trust).
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db } from '../core/database.js'
import { tagCounts, recentMemory, registerNewSkill } from '../core/memory.js'
import { runAgent } from '../workers/worker_router.js'
import { emitEvent } from '../core/events.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const AUTO_GEN_DIR = path.resolve(here, '../skills/auto_gen')

function activeOrPendingSkillExists(name: string): boolean {
  return !!db.prepare(
    `SELECT 1 FROM system_skills WHERE skill_name = ? AND status IN ('pending_review', 'active')`,
  ).get(name)
}

// Candidates in priority order. Each reads real counts from memory before
// proposing anything — this is what makes it "off the memory," not a
// static template that fires regardless of what's actually happening.
function detectGap(): { name: string; description: string; capabilities: string[]; evidence: any[] } | null {
  const counts = tagCounts()
  const qaRejects = counts['qa_reject'] ?? 0
  const suppressedFails = counts['fail:suppressed'] ?? 0

  if (qaRejects >= 2 && !activeOrPendingSkillExists('draft_prescreen')) {
    return {
      name: 'draft_prescreen',
      description: `The CEO has rejected ${qaRejects} CMO drafts on the banned-phrase rule alone — each rejection costs a full extra CMO+CEO round trip. A pre-screen that catches banned phrases before the CEO ever sees the draft removes that entire loop.`,
      capabilities: [],
      evidence: recentMemory('qa_reject', 5),
    }
  }

  if (suppressedFails >= 1 && !activeOrPendingSkillExists('domain_reachability_check')) {
    return {
      name: 'domain_reachability_check',
      description: `At least one lead's site is unreachable at draft time — sending outreach to a company whose own domain doesn't resolve is a wasted cycle and a bounce risk. A pre-send reachability check protects domain reputation (see Risk Register).`,
      capabilities: ['http_get', 'db_write'],
      evidence: recentMemory('fail:suppressed', 5),
    }
  }

  // Structural gap, not memory-triggered — true regardless of today's volume:
  // site_fetch.ts makes exactly one attempt at a 10s timeout with no retry.
  // A real trade-business site on cheap shared hosting can legitimately be
  // slow without being dead; one bad round-trip currently reads identically
  // to "unreachable" and can cost a genuinely good lead. Ordered ahead of the
  // lead_enrichment fallback since it's the more specific, better-evidenced
  // of the two always-available candidates.
  if (!activeOrPendingSkillExists('site_fetch_retry')) {
    return {
      name: 'site_fetch_retry',
      description: `core/site_fetch.ts gives every prospect site exactly one 10-second attempt before recording fetch_error — a transient network blip or a slow-but-real small-business host currently reads identically to a genuinely dead domain, and either way the Researcher never gets a second look. A short retry (2 attempts, backoff) before giving up protects against false negatives on real leads.`,
      capabilities: ['http_get'],
      evidence: [],
    }
  }

  // Default candidate when memory is still thin: the site has no lead
  // enrichment capability yet, and Part I flags "lead sourcing" as an open
  // decision — proposing it is a genuine, always-true gap, not a guess.
  if (!activeOrPendingSkillExists('lead_enrichment')) {
    const pending = (db.prepare(`SELECT COUNT(*) n FROM leads WHERE lead_status='pending'`).get() as any).n
    return {
      name: 'lead_enrichment',
      description: `No skill yet confirms a prospect's website is actually live before the Researcher spends a cycle on it. ${pending} lead(s) currently queued with unverified URLs.`,
      capabilities: ['http_get'],
      evidence: recentMemory(undefined, 5),
    }
  }

  return null
}

export async function runDevAgentCycle(source = 'manual'): Promise<{ proposed: boolean; skillId?: string; reason: string }> {
  const gap = detectGap()
  if (!gap) {
    emitEvent('feed', { msg: 'Dev Agent: no unmet capability found — memory is clean', kind: 'system' })
    return { proposed: false, reason: 'no gap detected' }
  }

  emitEvent('feed', { msg: `Dev Agent: capability gap found — ${gap.name}`, kind: 'system' })
  const output = await runAgent('dev_agent', {
    gap: { name: gap.name, description: gap.description, capabilities: gap.capabilities },
    evidence: gap.evidence,
  })

  if (typeof output === 'string' && output.trim().startsWith('NEEDS_HUMAN')) {
    emitEvent('feed', { msg: `Dev Agent declined — ${output.trim().slice(0, 140)}`, kind: 'alert' })
    return { proposed: false, reason: output }
  }

  mkdirSync(AUTO_GEN_DIR, { recursive: true })
  const filePath = `src/skills/auto_gen/${gap.name}.ts`
  writeFileSync(path.resolve(here, '../skills/auto_gen', `${gap.name}.ts`), output, 'utf-8')

  const skillId = registerNewSkill(gap.name, gap.description, filePath, output)
  emitEvent('feed', { msg: `Dev Agent proposed skill: ${gap.name} — awaiting human review`, kind: 'system' })
  emitEvent('pulse', { n: 5 })
  console.log(`[dev_agent:${source}] wrote ${filePath}, registered ${skillId} (pending_review)`)
  return { proposed: true, skillId, reason: gap.description }
}
