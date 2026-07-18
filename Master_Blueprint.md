# 🏛️ Fieldstone Web Co. — Agentic OS & Master Multi-Agent Engine (v3.1 · Complete Edition)

## Absolute Source of Truth: Local Self-Evolving Workforce & UI/UX Pro Frontend

This document governs the business scaling plan, operational blueprint, system architecture, agent prompt profiles, database design, design system, and automated Skill Generation lifecycle for the Fieldstone Web Co. autonomous client acquisition engine. The application runs locally on a Windows Desktop environment to eliminate operational hosting fees ($0 footprint) while presenting an ultra-premium, cinematic dashboard built around the **Synapse Core** — a glowing blue neural-network sphere.

> **v3.1 (Complete Edition):** adds Part I — Business & Scaling Plan grounded in the live site's real tier pricing; full system prompts for all six agents (`profiles.json`); the CEO orchestrator state machine; the Ollama↔Claude worker router; the Skill Factory safety contract; extended database schema (outreach, token ledger, daily metrics, suppression list); the SSE live-data bridge and `synapseBus`; email compliance + human approval gates; risk register; and the sprint-by-sprint build order.

---

## 📑 Table of Contents

- **Part I — Business & Scaling Plan**: offer ladder · funnel math · token budget · phased roadmap · operating cadence · compliance · risk register
- **Part II — System Architecture**: workflow matrix · the Executive Board · agent prompt profiles
- **Part III — Core Runtime**: lead state machine · orchestrator · worker router · Skill Factory contract · database schema · memory core · live-data bridge
- **Part IV — Design System "Deep Field"**: tokens · typography · spacing · glass panels · motion
- **Part V — The Synapse Core**: neural sphere spec · reference implementation · `synapseBus`
- **Part VI — Dashboard Screens**: Mission Control · Pipeline · Agent Detail · Financial Growth
- **Part VII — Workspace Layout & Environment**
- **Part VIII — Build Order & Setup Checklist**

---
---

# PART I — BUSINESS & SCALING PLAN

## 🎯 Mission

Fieldstone Web Co sells custom operational software to multi-truck HVAC, plumbing, and electrical operations (Kansas City metro first, then expand). The Agentic OS exists to do one thing: **keep a steady stream of qualified discovery calls landing on the calendar at near-zero marginal cost**, so human time is spent closing and building, not prospecting.

## 💰 The Offer Ladder (live on the site — `src/components/TradePlans.jsx`)

| Tier | Name | Price | Target buyer | Role in the ladder |
|------|------|-------|--------------|--------------------|
| 1 | Operations Kickstart | **$399/mo** | 2–5 truck shops drowning in text-thread estimates | Wedge product — fast yes, fast install |
| 2 | Growth CRM Suite | **$799/mo** (up to 5 seats) | 5–15 truck operations with office staff | Core revenue engine |
| 3 | Custom Enterprise Architecture | **Custom MRR** | 15+ trucks, multi-branch | Anchor accounts, case studies |

Zero setup fees is the standing promise — the demos under `/demo/` are the proof artifacts the Sales Rep Agent links in follow-ups.

**MRR milestones the engine is accountable for:**

| Milestone | Mix | MRR | Meaning |
|-----------|-----|-----|---------|
| M1 | 5 × Tier 1 | $1,995 | Engine validated — cold outreach converts |
| M2 | 8 × T1 + 3 × T2 | $5,589 | Quit-rate revenue; raise send volume |
| M3 | 10 × T1 + 6 × T2 + 1 × T3 (~$2k) | ~$10,783 | Hire/contract first delivery help |

## 📈 Funnel Math (conservative cold-email benchmarks)

Working assumptions — the Analytics Agent replaces these with measured actuals within 30 days:

```text
200 targeted emails/week
  → ~40–50% open (verified domain, warmed, personalized subject)
  → ~4–6% reply (audit-driven personalization is the whole edge)
  → 8–12 replies/week → 2–4 positive → 1–2 discovery calls
  → close rate 25–50% on calls (they've already seen their own site's flaws)
  ≈ 2–4 new Tier-1 clients/month at steady state
```

Every stage is a `lead_status` in the database and a stage on the Pipeline funnel chart — if a week's cohort deviates >30% from benchmark, the Analytics Agent flags the stage in its daily digest.

## 🪙 Token Budget & Unit Economics

**Cost-model rule (locked in, Sprint 1):** the engine must never produce a bill we didn't explicitly opt into. The worker router has three modes, set by `AGENT_MODE`:

| Mode | Who thinks | What it costs | When it runs out |
|------|-----------|---------------|------------------|
| `dry-run` (default) | Canned outputs, no network | $0 | Never |
| `claude-code` | Local `claude -p` (headless Claude Code) on the **Claude subscription** | $0 beyond the subscription | **Stops working** until the limit resets — never bills extra |
| `api` | Anthropic API key | **Pay per token** | Keeps billing — which is why it requires a double opt-in (`ALLOW_PAID_API=true` **and** a key) and is off by default |

The Claude subscription and the Anthropic API are separate billing worlds: API usage does **not** draw from the subscription and does charge per token. Default operating mode for production is `claude-code` — subscription-billed, hard-stop, matching the "if it exceeds usage it just stops" requirement.

Principle: **measure, don't estimate.** Every model call is written to the `agent_runs` ledger (Part III) with input/output token counts; the Analytics Agent prices them against current Anthropic rates and posts cost-per-lead and cost-per-converted-client to the Financial Growth screen daily.

Hard guardrails enforced by the orchestrator:
- **Daily spend cap** (`DAILY_TOKEN_BUDGET_USD`, default $5): when the ledger crosses it, cloud-agent dispatch pauses until the next day; local Qwen work continues free.
- **Per-lead cap** (default $0.25): a lead that exceeds it moves to `failed` with reason `budget_exceeded` — no infinite retry loops.
- **Routing discipline:** research/audit → local Qwen ($0); copy/QA/code → Sonnet; classification/sentiment/metrics → Haiku. The expensive model never does work the cheap one can.

## 🗓️ Phased Roadmap

**Phase 0 — Foundation (Week 1–2).** Buy + verify `fieldstone-webco.com` in Resend (SPF/DKIM/DMARC); install Ollama + Qwen; scaffold backend + database; orchestrator runs in **dry-run mode** (full pipeline, emails written to DB, nothing sent). Exit: 25 leads flow `pending → validated` untouched by hand.

**Phase 1 — Supervised Outreach (Week 3–6).** Domain warmup: 10/day week 3 → 20/day week 4 → 40/day week 5+. **Every email human-approved** in the dashboard (the `validated → sent` gate). Exit: first discovery call booked; deliverability (opens >35%, bounces <3%) holding.

**Phase 2 — Scaled Semi-Autonomy (Week 7–12).** Volume to 200/wk. CEO Agent auto-approves drafts scoring ≥ threshold on its QA rubric; borderline drafts still queue for human review. Skill Factory live — first auto-generated skills (lead enrichment, reply parsing). Exit: M1 milestone ($1,995 MRR).

**Phase 3 — Compounding (Month 4+).** Second vertical or metro added as a config change (new lead source + prompt variables, zero code). Tier-2 upsell sequences for installed Tier-1 clients. Analytics Agent runs weekly A/B cohorts on subject lines/angles. Exit: M2, then M3.

## ⏰ Daily Operating Cadence

| Time | Actor | Action |
|------|-------|--------|
| 07:00 | Orchestrator (Task Scheduler) | Pull new leads, dispatch Researcher batch (local, free) |
| 08:30 | CMO + CEO | Draft + QA loop on audited leads |
| 09:00 | **Human (5–10 min)** | Approve/reject queued drafts in Mission Control |
| 09:30–11:30 | Sales Rep | Staggered sends (business-hours delivery, jittered) |
| Hourly | Sales Rep | Poll Resend webhooks → classify replies → flag positives (push notification) |
| 18:00 | Analytics | Daily digest → dashboard + Obsidian vault; ledger reconciliation |
| Sunday | Dev Agent | Weekly: propose skills for the week's most common failure |

Human time: ~15 min/day + discovery calls. That is the entire labor cost of the acquisition engine.

## ⚖️ Compliance (non-negotiable, enforced in code)

B2B cold email is legal under CAN-SPAM **only** when compliant — one spam-trap disaster kills the domain, and the domain is the business:

1. Accurate From/Reply-To (`sebastian@fieldstone-webco.com`), no deceptive subjects.
2. Physical postal address in every email footer (`BUSINESS_POSTAL_ADDRESS` env var — required at startup).
3. Working one-click opt-out in every send; unsubscribes land in the `suppression` table and are honored immediately (law allows 10 business days; we do it instantly). The orchestrator **refuses** to send to any suppressed address — checked at dispatch, not at draft.
4. Send throttling + jitter (never bursts), business hours only, target timezone.
5. Bounce handling: hard bounce → suppression; >5% bounce rate in a batch → auto-pause sends + alert.

## ⚠️ Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Domain reputation burn | Medium | Critical | Warmup ramp, throttles, bounce auto-pause, subdomain sending (`mail.fieldstone-webco.com`) so the root domain stays clean |
| API cost overrun | Medium | Medium | Daily + per-lead caps, ledger reconciliation, local-first routing |
| Auto-generated skill misbehaves | Medium | High | Skill Factory safety contract (Part III): sandboxed capabilities, human review before first execution, kill switch |
| SQLite corruption via OneDrive sync | **High if ignored** | High | **Workspace lives at `C:\dev\fieldstone-workspace` — never inside OneDrive.** Nightly `.backup` copy into the Obsidian vault |
| Reply misclassification (missed hot lead) | Medium | Medium | Positive-leaning classifier threshold + every reply also lands in the human-visible feed |
| Single-machine downtime | Low | Low | Everything is files + SQLite; restore = clone repo, restore DB backup, re-enter `.env` |

---
---

# PART II — SYSTEM ARCHITECTURE

## 🗺️ Workflow Matrix

The system routes cognitive loads contextually across premium cloud reasoning models and local GPU resources to achieve zero-token operational efficiency on basic structural workflows:

```text
                [ HUMAN OPERATOR via CLAUDE CODE ]
                              │
                              ▼
        ┌───────────────────────────────────────┐
        │   UI/UX Pro Immersive Web Dashboard   │ ◄── (Synapse Core — 3D WebGL
        └───────────────────┬───────────────────┘      Neural Sphere)
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   CEO Agent (Orchestrator — Sonnet)   │
        └───────────────────┬───────────────────┘
                            │
      ┌─────────────────────┼─────────────────────┐
      ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│  Researcher  │    │  CMO Agent   │    │  Sales Rep Agent │
│ (Qwen local) │    │  (Sonnet)    │    │     (Haiku)      │
└──────┬───────┘    └──────┬───────┘    └────────┬─────────┘
       │                   │                     │
       └───────────────────┼─────────────────────┘
                           ▼
        ┌───────────────────────────────────────┐
        │      Analytics Agent (Haiku)          │
        └───────────────────┬───────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │      Developer Agent (Sonnet)         │ ──► [ Dynamic Skill Factory ]
        └───────────────────┬───────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  Local Task Runner & Local SQLite DB  │ ──► [ Obsidian Vault Sync ]
        └───────────────────────────────────────┘
```

## 👥 The Executive Board (Roles, Contexts, & Multi-Provider Routing)

### 1. CEO Agent (`ceo_agent`)
- **Model/Endpoint**: Claude Sonnet 5 (`claude-sonnet-5`) / Anthropic API
- **Role**: Operational Guardrail, Task Broker, Quality Assurance Inspector.
- **Behavior**: Reads the lead queue, dispatches contextual payloads sequentially to individual agents, and QA-inspects the copywriter's output. Generic AI fluff is rejected immediately with concrete optimization feedback for the CMO.

### 2. Researcher Agent (`researcher_agent`)
- **Model/Endpoint**: Qwen 2.5-Coder (7B/14B) / Local Ollama Engine ($0 tokens)
- **Role**: Technical Web Auditor & Competitive Profiler.
- **Behavior**: Extracts structural layout shifts, mobile display errors, slow rendering components, and semantic SEO failures of target business domains. Drops findings into SQLite as clean data maps.

### 3. CMO Agent (`cmo_agent`)
- **Model/Endpoint**: Claude Sonnet 5 / Anthropic API
- **Role**: Creative Strategy & Conversion Acquisition Copywriter.
- **Behavior**: Converts technical audit briefs into highly precise, personal outreach copy targeting real site flaws, rigidly under 150 words, zero machine tropes.

### 4. Sales Rep Agent (`sales_rep_agent`)
- **Model/Endpoint**: Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) / Anthropic API
- **Role**: Client Pipeline Manager & Sentiment Processor.
- **Behavior**: Classifies incoming replies on the verified domain; flags positive leads for immediate video-call conversion; drafts short contextual follow-ups.

### 5. Analytics Agent (`analytics_agent`)
- **Model/Endpoint**: Claude Haiku 4.5 / Anthropic API
- **Role**: Operational ROI Auditor & Data Scientist.
- **Behavior**: Reconciles the token ledger, Resend delivery metrics, and conversion thresholds into the daily digest for the dashboard and Obsidian vault.

### 6. Developer Agent (`dev_agent`)
- **Model/Endpoint**: Claude Sonnet 5 / Anthropic API
- **Role**: Code Engineering & Agentic OS Dynamic Skill Builder.
- **Behavior**: Monitors workflow exceptions. When an agent lacks a capability, writes a complete TypeScript skill class conforming to the Skill Factory contract and registers it for human review.

## 📜 Agent Prompt Profiles — `apps/backend/config/profiles.json`

The permanent system prompts. `{{variables}}` are injected by the orchestrator at dispatch time.

```json
{
  "ceo_agent": {
    "provider": "anthropic",
    "model": "claude-sonnet-5",
    "max_tokens": 1024,
    "system": "You are the CEO Agent of Fieldstone Web Co's client acquisition engine. Fieldstone sells operational software to multi-truck HVAC, plumbing, and electrical companies ($399/mo Kickstart, $799/mo Growth CRM, custom Enterprise; zero setup fees). Your job is quality control, not creation. When reviewing an outreach draft, score it 0-100 against this rubric: (1) references at least two SPECIFIC, verifiable flaws from the audit brief — 40pts; (2) under 150 words, skimmable in 15 seconds — 20pts; (3) zero generic AI phrasing (no 'I hope this finds you well', 'in today's digital landscape', 'streamline your operations', 'I noticed your website') — 25pts; (4) single concrete CTA: a 15-minute call, with a reason tied to their trade — 15pts. Score >= {{qa_threshold}}: respond APPROVE. Otherwise respond REJECT followed by numbered, concrete fixes referencing exact sentences. Never rewrite the draft yourself. Output format: first line 'APPROVE <score>' or 'REJECT <score>', then feedback."
  },
  "researcher_agent": {
    "provider": "ollama",
    "model": "qwen2.5-coder:7b",
    "system": "You are a technical web auditor. You receive raw HTML, response headers, and Lighthouse-style metrics for a trade-services company website. Produce ONLY a JSON object: {\"company\": str, \"trade\": str, \"flaws\": [{\"type\": \"mobile|speed|seo|layout|trust|conversion\", \"detail\": str, \"evidence\": str, \"severity\": 1-5}], \"has_online_booking\": bool, \"has_ssl\": bool, \"copyright_year\": str|null, \"estimated_last_update\": str}. Rules: every flaw must cite concrete evidence (an element, a measurement, a missing tag) — never speculate. Severity 5 = actively costing them jobs (broken phone link, non-mobile layout). Find a minimum of 3 flaws; if the site is genuinely excellent, return flaws:[] so the lead is deprioritized. No prose outside the JSON."
  },
  "cmo_agent": {
    "provider": "anthropic",
    "model": "claude-sonnet-5",
    "max_tokens": 512,
    "system": "You write cold outreach for Fieldstone Web Co, which builds operational software for trades businesses (HVAC, plumbing, electrical). You receive a JSON audit of the prospect's website. Write an email under 150 words that reads like one sharp tradesperson-adjacent operator writing to another. Rules: open with the single most expensive flaw phrased as its business consequence (missed after-hours calls, jobs lost to the competitor who answers first) — never as a tech critique. Reference exactly 2 flaws, no more. No links except {{demo_link}} if and only if the audit shows they lack what the demo shows. CTA: a 15-minute call, offered once, no pressure language. Banned: 'I hope', 'streamline', 'solutions', 'in today's', 'boost', 'take your business to the next level', 'I noticed', em-dash chains, bullet lists, more than one question mark. Subject line: under 6 words, references their company or trade specifically, no clickbait. Output JSON: {\"subject\": str, \"body\": str}."
  },
  "sales_rep_agent": {
    "provider": "anthropic",
    "model": "claude-haiku-4-5-20251001",
    "max_tokens": 512,
    "system": "You classify replies to Fieldstone Web Co's outreach and draft responses. Given a reply email, output JSON: {\"sentiment\": \"positive|neutral|negative|unsubscribe|bounce|auto_reply\", \"intent\": str, \"urgency\": 1-5, \"suggested_reply\": str|null, \"action\": \"book_call|nurture|suppress|ignore\"}. Rules: 'unsubscribe' catches ANY removal request however phrased — when in doubt between negative and unsubscribe, choose unsubscribe. Positive replies: urgency 4+, action book_call, suggested_reply proposes two concrete time windows and includes {{calendar_link}}. Neutral ('not right now'): action nurture. suggested_reply must match the prospect's tone and length — a two-line reply gets a two-line response. Never oversell; the demo and the call do the selling."
  },
  "analytics_agent": {
    "provider": "anthropic",
    "model": "claude-haiku-4-5-20251001",
    "max_tokens": 1024,
    "system": "You are the analytics auditor. You receive: today's agent_runs ledger rows, Resend event counts, and lead_status transition counts. Produce a markdown daily digest with: (1) funnel table — leads per status with day-over-day delta; (2) cost — total tokens by agent, estimated spend, cost per lead reaching 'sent'; (3) deliverability — sends, opens, bounces, replies with rates; (4) ANOMALIES — any stage deviating >30% from the trailing 7-day mean, flagged with the most likely cause from the data (never speculation beyond the data); (5) one specific, testable recommendation. Keep it under 400 words. Numbers in tables, insight in prose."
  },
  "dev_agent": {
    "provider": "anthropic",
    "model": "claude-sonnet-5",
    "max_tokens": 4096,
    "system": "You are the Developer Agent. You receive a capability gap report (an error or missing function encountered by another agent) and must write a complete TypeScript skill class implementing the BaseSkill contract: constructor(ctx: SkillContext), async execute(input: unknown): Promise<SkillResult>, static manifest: {name, description, version, capabilities}. Constraints: capabilities may only request from the allowlist ['http_get', 'db_read', 'db_write', 'file_read_workspace']. Never request file writes outside the workspace, shell execution, or credential access — if the gap genuinely requires them, output NEEDS_HUMAN with an explanation instead of code. Include input validation, typed errors, and a 10-second timeout on any network call. Output: the complete .ts file content only, no explanation."
  }
}
```

---
---

# PART III — CORE RUNTIME

## 🔄 The Lead State Machine

Single source of truth for pipeline position — every transition is written by exactly one actor, so there are no races:

```text
 pending ──► processing ──► audited ──► drafted ──► validated ──► sent ──► converted
    │            │             │           │            │           │
    └────────────┴─────────────┴───────────┴────────────┴───────────┴──────► failed
                                                                            (reason logged)

 pending→processing   orchestrator claims the lead (batch of 5)
 processing→audited   Researcher returns valid audit JSON (≥1 flaw; else failed:no_flaws)
 audited→drafted      CMO draft passes CEO QA (max 3 revision loops, else failed:qa_exhausted)
 drafted→validated    HUMAN approves in dashboard (Phase 2+: CEO score ≥ auto_approve_threshold)
 validated→sent       Sales Rep dispatches via Resend — suppression list checked HERE
 sent→converted       discovery call booked (human marks, or positive-reply auto-flag confirmed)
 any→failed           budget cap, 3× error, bounce, or unsubscribe
```

## 🧭 Orchestrator Core Loop — `apps/backend/src/core/orchestrator.ts` (reference shape)

```typescript
import { db } from "./database";
import { runAgent } from "../workers/worker_router";
import { commitEpisodicMemory } from "./memory";
import { emitDashboardEvent } from "./events";
import { assertUnderBudget, recordRun } from "./ledger";

const BATCH_SIZE = 5;
const MAX_QA_LOOPS = 3;

export async function tick() {
  await assertUnderBudget();                      // throws BudgetExceeded → pause cloud work

  // 1. Claim pending leads
  const leads = db.prepare(
    `UPDATE leads SET lead_status='processing', updated_at=CURRENT_TIMESTAMP
     WHERE id IN (SELECT id FROM leads WHERE lead_status='pending' LIMIT ?)
     RETURNING *`).all(BATCH_SIZE);

  for (const lead of leads) {
    try {
      // 2. Audit — local Qwen, $0
      const audit = await runAgent("researcher_agent", await fetchSiteBundle(lead.website_url));
      if (!audit.flaws?.length) { fail(lead, "no_flaws"); continue; }
      transition(lead, "audited", { audit });

      // 3. Draft ↔ QA loop
      let draft, verdict, feedback = "";
      for (let i = 0; i < MAX_QA_LOOPS; i++) {
        draft = await runAgent("cmo_agent", { audit, feedback, demo_link: demoFor(audit) });
        verdict = await runAgent("ceo_agent", { draft, audit });
        if (verdict.approved) break;
        feedback = verdict.feedback;
      }
      if (!verdict.approved) { fail(lead, "qa_exhausted"); continue; }

      // 4. Queue for the human approval gate (Phase 2+: auto-approve on high score)
      saveOutreach(lead, draft, verdict.score);
      transition(lead, "drafted");
      emitDashboardEvent("pulse", { n: 3, kind: "draft_ready", lead: lead.company_name });
    } catch (err) {
      retryOrFail(lead, err);                     // 3 attempts w/ backoff, then failed
    }
  }
}
// Sending, reply polling, and the daily digest run as separate scheduled jobs
// (see Daily Operating Cadence) — never inside this loop.
```

## 🔀 Worker Router — `apps/backend/src/workers/worker_router.ts` (reference shape)

```typescript
import Anthropic from "@anthropic-ai/sdk";
import profiles from "../../config/profiles.json";
import { recordRun } from "../core/ledger";

const anthropic = new Anthropic();               // reads ANTHROPIC_API_KEY

export async function runAgent(agentId: string, payload: unknown) {
  const p = profiles[agentId];
  const started = Date.now();

  if (p.provider === "ollama") {                 // local — $0, no budget check
    const res = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      body: JSON.stringify({
        model: p.model, stream: false,
        messages: [{ role: "system", content: p.system },
                   { role: "user", content: JSON.stringify(payload) }],
        format: "json",
      }),
    }).then(r => r.json());
    recordRun(agentId, p.model, 0, 0, Date.now() - started);
    return JSON.parse(res.message.content);
  }

  const msg = await anthropic.messages.create({
    model: p.model,
    max_tokens: p.max_tokens,
    system: interpolate(p.system, payload),      // fills {{variables}}
    messages: [{ role: "user", content: JSON.stringify(payload) }],
  });
  recordRun(agentId, p.model, msg.usage.input_tokens, msg.usage.output_tokens,
            Date.now() - started);               // → agent_runs ledger
  return parseAgentOutput(agentId, msg);         // JSON.parse w/ schema check + 1 retry
}
```

## 🏭 Skill Factory Contract & Safety — `apps/backend/src/skills/base_skill.ts`

```typescript
export interface SkillManifest {
  name: string;
  description: string;
  version: string;
  capabilities: Capability[];       // ONLY from the allowlist below
}
export type Capability = "http_get" | "db_read" | "db_write" | "file_read_workspace";

export interface SkillContext {
  httpGet(url: string): Promise<string>;   // 10s timeout, no auth headers, GET only
  dbRead(sql: string, params?: unknown[]): unknown[];
  dbWrite(sql: string, params?: unknown[]): void;   // granted only if manifest asks
  readWorkspaceFile(relPath: string): string;       // jailed to workspace root
  log(msg: string): void;
}

export interface SkillResult { ok: boolean; data?: unknown; error?: string }

export abstract class BaseSkill {
  constructor(protected ctx: SkillContext) {}
  abstract execute(input: unknown): Promise<SkillResult>;
}
```

**Safety lifecycle (non-negotiable):**
1. Dev Agent output lands in `skills/[auto_gen]/` with `status='pending_review'` in `system_skills` — it is **not** loaded into the runtime.
2. New skills appear in the dashboard's review queue; a human reads the code and approves → `status='active'`. There is no auto-activation path.
3. Skills receive **only** the capabilities their manifest declares; the `SkillContext` given to them physically lacks everything else (no `fs`, no `child_process`, no env access — capability injection, not trust).
4. Any uncaught throw or >3 timeout strikes auto-sets `status='disabled'` + dashboard alert.
5. Kill switch: `DISABLE_SKILLS=true` env var bypasses the entire factory at startup.

## 💾 Database Schema — `apps/backend/schema.sql` (complete)

```sql
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    website_url TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    trade TEXT,                                   -- hvac | plumbing | electrical | other
    city TEXT,
    lead_status TEXT CHECK(lead_status IN ('pending','processing','audited','drafted',
        'validated','sent','converted','failed')) DEFAULT 'pending',
    fail_reason TEXT,
    audit_json TEXT,                              -- Researcher output
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(lead_status);

CREATE TABLE IF NOT EXISTS outreach_emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id TEXT NOT NULL REFERENCES leads(id),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    qa_score INTEGER,                             -- CEO rubric score
    approved_by TEXT,                             -- 'human' | 'ceo_auto'
    resend_message_id TEXT,
    sent_at TIMESTAMP,
    opened_at TIMESTAMP,
    replied_at TIMESTAMP,
    reply_sentiment TEXT,                         -- sales_rep classification
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppression (
    email TEXT PRIMARY KEY,
    reason TEXT CHECK(reason IN ('unsubscribe','hard_bounce','complaint','manual')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_runs (           -- the token ledger
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER,
    lead_id TEXT REFERENCES leads(id),
    ran_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_runs_day ON agent_runs(ran_at);

CREATE TABLE IF NOT EXISTS daily_metrics (        -- Analytics Agent snapshot, one row/day
    day TEXT PRIMARY KEY,                         -- YYYY-MM-DD
    leads_in INTEGER, audited INTEGER, drafted INTEGER, sent INTEGER,
    opens INTEGER, replies INTEGER, positives INTEGER, calls_booked INTEGER,
    bounces INTEGER, unsubscribes INTEGER,
    est_spend_usd REAL,
    digest_md TEXT                                -- rendered daily digest
);

CREATE TABLE IF NOT EXISTS system_skills (
    id TEXT PRIMARY KEY,
    skill_name TEXT NOT NULL,
    description TEXT NOT NULL,
    file_path TEXT NOT NULL,
    code_body TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending_review','active','disabled')) DEFAULT 'pending_review',
    generated_by_agent TEXT DEFAULT 'dev_agent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS episodic_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id TEXT REFERENCES leads(id),
    vector_tag TEXT NOT NULL,
    memory_payload TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🧠 Memory Core — `apps/backend/src/core/memory.ts`

```typescript
import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(__dirname, "../../local_engine.db"));

export async function commitEpisodicMemory(leadId: string, tag: string, payload: string) {
  db.prepare(`INSERT INTO episodic_memory (lead_id, vector_tag, memory_payload)
              VALUES (?, ?, ?)`).run(leadId, tag, payload);
  console.log(`[MEMORY CORE] Vector context tag [${tag}] stored.`);
}

export async function registerNewSkill(name: string, desc: string, targetPath: string, code: string) {
  db.prepare(`INSERT INTO system_skills (id, skill_name, description, file_path, code_body)
              VALUES (?, ?, ?, ?, ?)`)
    .run(`skill_${Date.now()}`, name, desc, targetPath, code);
  console.log(`[SKILL FACTORY] Skill queued for human review: ${name}`);
}
```

## 📡 Live-Data Bridge (backend → dashboard)

The backend runs a tiny HTTP server (same Node process, `localhost:4600`):

| Endpoint | Type | Serves |
|----------|------|--------|
| `GET /api/state` | JSON | Full snapshot: roster status, funnel counts, KPIs, pending approvals, skill review queue |
| `GET /api/events` | **SSE** | Push stream: `agent_status`, `feed` (activity lines), `pulse` (Synapse Core bursts), `approval_needed`, `alert` |
| `POST /api/approve/:outreachId` | JSON | The human gate — flips `drafted → validated` |
| `POST /api/skills/:id/approve` | JSON | Activates a reviewed skill |

SSE (not WebSocket) because traffic is one-directional push + occasional REST actions — simpler, auto-reconnecting, zero deps. The dashboard opens one `EventSource`; every `feed` event also calls `synapseBus.emit("pulse", n)` so business activity is literally visible as light moving across the sphere.

---
---

# PART IV — DESIGN SYSTEM — "Deep Field" (UI/UX Pro Max)

**Style family:** Modern Dark / Cinematic Glassmorphism — deep near-black backgrounds, ambient glow, frosted-glass panels, layered depth. Best-for match: AI tool interfaces, pro dashboards, fintech-grade ops consoles.
**Design dials:** Variance 7 (modern/bold), Motion 8 (complex choreography), Density 8 (dense dashboard, 8–32px spacing scale).

> Palette note: the database's closest dark-dashboard matches ship green accents (status-green fintech). Per the brand direction — *glowing blue, like out of a movie* — the accent family is swapped to electric cyan/blue; green/amber/red are retained strictly as semantic status colors.

### Color Tokens

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Background (app) | `#020617` | `--color-background` |
| Surface / Card | `#0E1223` | `--color-card` |
| Surface raised | `#1A1E2F` | `--color-muted` |
| Foreground | `#F8FAFC` | `--color-foreground` |
| Muted text | `#94A3B8` | `--color-muted-foreground` |
| Border | `rgba(148,163,184,0.14)` | `--color-border` |
| **Primary (electric blue)** | `#38BDF8` | `--color-primary` |
| **Accent (cyan glow)** | `#22D3EE` | `--color-accent` |
| Deep glow (halos only) | `#0EA5E9` | `--color-glow` |
| Status: running / success | `#22C55E` | `--color-success` |
| Status: queued / warning | `#F59E0B` | `--color-warning` |
| Status: failed / destructive | `#EF4444` | `--color-destructive` |
| Ring (focus) | `#38BDF8` | `--color-ring` |

Rules:
- Never pure `#000000` backgrounds (OLED smear + crushed glow falloff). `#020617` is the floor.
- Glow is an *effect*, not a text color — body text on dark is `#F8FAFC` / `#94A3B8` only (both pass 4.5:1 on `#0E1223`).
- Cyan `#22D3EE` on `#020617` passes contrast for labels ≥ 12px; below that, use it for borders/icons only.
- Raw hex never appears in components — CSS variables only.

### Typography

- **Headings / display:** Space Grotesk (500–700) — tech, futuristic, matches the brand.
- **Body / UI:** DM Sans (400–500).
- **Data / metrics / logs:** JetBrains Mono (400–600) — all KPIs, timestamps, token counts, and terminal feeds render in mono.

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

Base 16px, line-height 1.5. Dashboard label style: 10–11px mono, uppercase, `letter-spacing: 0.3em`, `--color-muted-foreground`.

### Spacing (dense dashboard scale)

`--space-1: 4px` · `--space-2: 8px` · `--space-3: 12px` · `--space-4: 16px` · `--space-5: 24px` · `--space-6: 32px`. Panel padding 16px, grid gap 12–16px, section gap 32px.

### Glass Panel Recipe (the one card style, used everywhere)

```css
.panel {
  background: linear-gradient(160deg, rgba(14,18,35,0.85), rgba(2,6,23,0.9));
  border: 1px solid var(--color-border);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  box-shadow: 0 0 40px rgba(14,165,233,0.06), inset 0 1px 0 rgba(255,255,255,0.04);
}
.panel--active { border-color: rgba(56,189,248,0.35); box-shadow: 0 0 60px rgba(14,165,233,0.12); }
```

### Motion Rules

- Micro-interactions 150–300ms; panel/page choreography 500–800ms with `expo.out` / `cubic-bezier(0.16,1,0.3,1)`.
- Hover: scale press `0.97 → 1.0`, glow-border fade-in 200ms.
- Live data enters with a 150ms opacity+translateY(4px) stagger — never instant pops.
- **`prefers-reduced-motion`: every animation (including the sphere) freezes to a static frame.**
- Anti-patterns: decorative-only animation, animating width/height (use transform), motion without meaning.

---
---

# PART V — THE SYNAPSE CORE — Neural Sphere

The dashboard centerpiece. A slowly rotating sphere of neuron nodes joined by glowing blue synaptic connections, with bright signal pulses traveling along the edges — the visual heartbeat of the agent engine. Every agent event (lead audited, email drafted, skill generated) fires a pulse burst through `synapseBus`.

### Visual spec
- **Nodes:** ~420 points distributed on the sphere surface via Fibonacci-sphere sampling (even coverage, no pole clumping). Size-attenuated, cyan `#22D3EE`, additive blending.
- **Connections:** each node linked to its 3 nearest neighbors within a distance threshold — precomputed once, rendered as a single `LineSegments` (one draw call). Color `#0EA5E9` at ~12% opacity, additive blending → intersecting lines self-brighten like light.
- **Signal pulses:** 24 bright points that each pick a random edge, travel it in 0.6–1.4s, then hop to a connected edge. Rendered as a second `Points` buffer, `#7DD3FC`, 2.5× node size.
- **Inner nebula:** optional 1,200-particle inner cloud (`maath/random.inSphere`, radius 1.4) at 6% opacity for volumetric depth.
- **Bloom:** `@react-three/postprocessing` Bloom, `luminanceThreshold 0.18`, `intensity 1.15`, `mipmapBlur` — this is what makes it cinematic. No shadows anywhere in this scene.
- **Motion:** inner group spins ~0.04 rad/s on Y, 0.015 on X; an outer parallax group lerps toward the pointer (±0.08 rad) for a weighty, cinematic follow.
- **Event hook:** `synapseBus.emit('pulse', n)` re-seeds `n` pulses at a random node — business events become visible light.

### Performance budget (Three.js stack rules)
- All particles = `BufferGeometry` + `Points`. Never per-particle meshes.
- Total particle count ≤ 3,000 baseline (420 + 24 + 1,200 ≈ 1,650 — headroom intact). Profile before raising.
- Per-frame buffer mutation (pulses) **must** set `attributes.position.needsUpdate = true` or the GPU renders stale data.
- `antialias: true` set at renderer construction (it cannot be enabled after).
- ACES filmic tone mapping + sRGB output for correct glow falloff.
- DPR clamped to `[1, 2]`. Target 60fps desktop / 30fps mid-mobile.

### File: `apps/dashboard/src/lib/synapseBus.ts`

```typescript
type Handler = (n: number) => void;
const handlers = new Set<Handler>();

export const synapseBus = {
  emit(event: "pulse", n = 3) { if (event === "pulse") handlers.forEach(h => h(n)); },
  on(event: "pulse", h: Handler) { handlers.add(h); return () => handlers.delete(h); },
};
```

### File: `apps/dashboard/src/components/SynapseCore.tsx`

```tsx
import React, { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { synapseBus } from '../lib/synapseBus'

const NODE_COUNT = 420
const PULSE_COUNT = 24
const RADIUS = 2.0
const LINK_DIST = 0.55 // max neighbor distance for a synapse

// Even node distribution — Fibonacci sphere
function fibonacciSphere(count: number, radius: number) {
  const pts = new Float32Array(count * 3)
  const phi = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const t = phi * i
    pts.set([Math.cos(t) * r * radius, y * radius, Math.sin(t) * r * radius], i * 3)
  }
  return pts
}

// Precompute synapses: 3 nearest neighbors within LINK_DIST, deduped
function buildEdges(nodes: Float32Array) {
  const v = (i: number) => new THREE.Vector3(nodes[i * 3], nodes[i * 3 + 1], nodes[i * 3 + 2])
  const edges: [number, number][] = []
  const seen = new Set<string>()
  for (let i = 0; i < NODE_COUNT; i++) {
    const near = [] as { j: number; d: number }[]
    for (let j = 0; j < NODE_COUNT; j++) {
      if (i === j) continue
      const d = v(i).distanceTo(v(j))
      if (d < LINK_DIST) near.push({ j, d })
    }
    near.sort((a, b) => a.d - b.d).slice(0, 3).forEach(({ j }) => {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (!seen.has(key)) { seen.add(key); edges.push([i, j]) }
    })
  }
  return edges
}

function NeuralMesh() {
  const spin = useRef<THREE.Group>(null!)
  const pulseGeo = useRef<THREE.BufferGeometry>(null!)

  const nodes = useMemo(() => fibonacciSphere(NODE_COUNT, RADIUS), [])
  const edges = useMemo(() => buildEdges(nodes), [nodes])

  const linePositions = useMemo(() => {
    const arr = new Float32Array(edges.length * 6)
    edges.forEach(([a, b], k) => {
      arr.set(nodes.slice(a * 3, a * 3 + 3), k * 6)
      arr.set(nodes.slice(b * 3, b * 3 + 3), k * 6 + 3)
    })
    return arr
  }, [edges, nodes])

  // Pulse state: which edge, progress 0→1, speed
  const pulses = useMemo(() =>
    Array.from({ length: PULSE_COUNT }, () => ({
      edge: Math.floor(Math.random() * edges.length),
      t: Math.random(),
      speed: 0.7 + Math.random() * 1.1,
    })), [edges])
  const pulsePositions = useMemo(() => new Float32Array(PULSE_COUNT * 3), [])

  // Business events → burst: re-seed n pulses at one node so light radiates from a point
  useEffect(() => synapseBus.on('pulse', (n) => {
    const origin = Math.floor(Math.random() * NODE_COUNT)
    const local = edges.map((e, i) => (e[0] === origin || e[1] === origin) ? i : -1)
                       .filter(i => i >= 0)
    if (!local.length) return
    for (let k = 0; k < Math.min(n, PULSE_COUNT); k++) {
      const p = pulses[Math.floor(Math.random() * PULSE_COUNT)]
      p.edge = local[k % local.length]
      p.t = 0
      p.speed = 1.6 + Math.random() * 0.8   // bursts travel faster
    }
  }), [edges, pulses])

  useFrame((_, dt) => {
    spin.current.rotation.y += dt * 0.04
    spin.current.rotation.x += dt * 0.015

    // Advance pulses along their edges; hop to a new edge at the end
    pulses.forEach((p, i) => {
      p.t += dt * p.speed
      if (p.t >= 1) {
        p.t = 0
        p.edge = Math.floor(Math.random() * edges.length)
        p.speed = 0.7 + Math.random() * 1.1  // bursts decay back to ambient speed
      }
      const [a, b] = edges[p.edge]
      for (let c = 0; c < 3; c++) {
        pulsePositions[i * 3 + c] =
          nodes[a * 3 + c] + (nodes[b * 3 + c] - nodes[a * 3 + c]) * p.t
      }
    })
    pulseGeo.current.attributes.position.needsUpdate = true // GPU re-upload — required
  })

  return (
    <group ref={spin}>
      {/* Neuron nodes */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nodes, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#22D3EE" size={0.035} sizeAttenuation transparent
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* Synaptic connections — one draw call */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#0EA5E9" transparent opacity={0.12}
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>

      {/* Traveling signal pulses */}
      <points>
        <bufferGeometry ref={pulseGeo}>
          <bufferAttribute attach="attributes-position" args={[pulsePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#7DD3FC" size={0.09} sizeAttenuation transparent
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}

// Outer parallax rig: eases the whole sphere toward the pointer — weighty, cinematic
function ParallaxRig({ children }: { children: React.ReactNode }) {
  const rig = useRef<THREE.Group>(null!)
  const { pointer } = useThree()
  useFrame(() => {
    rig.current.rotation.x = THREE.MathUtils.lerp(rig.current.rotation.x, pointer.y * 0.08, 0.05)
    rig.current.rotation.y = THREE.MathUtils.lerp(rig.current.rotation.y, pointer.x * 0.08, 0.05)
  })
  return <group ref={rig}>{children}</group>
}

export const SynapseCore: React.FC = () => {
  const reduced = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return (
    <div className="relative aspect-square w-full max-w-[560px] rounded-full overflow-hidden
                    border border-cyan-500/20 bg-slate-950/40 backdrop-blur-md
                    shadow-[0_0_80px_rgba(14,165,233,0.10)]">
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <h3 className="text-xs font-mono uppercase tracking-[0.4em] text-cyan-400">Synapse Core</h3>
        <p className="text-[10px] font-mono text-slate-500 mt-1">Real-Time Vector Sync</p>
      </div>
      <Canvas
        gl={{ antialias: true, alpha: true }} // antialias only works at construction
        dpr={[1, 2]}
        camera={{ position: [0, 0, 4.6], fov: 45 }}
        frameloop={reduced ? 'demand' : 'always'}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.outputColorSpace = THREE.SRGBColorSpace
        }}
      >
        <ambientLight intensity={0.4} />
        <ParallaxRig>
          <NeuralMesh />
        </ParallaxRig>
        <EffectComposer>
          <Bloom luminanceThreshold={0.18} intensity={1.15} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
```

---
---

# PART VI — DASHBOARD SCREENS — "Command Center"

All screens share the Deep Field tokens, the glass panel recipe, and dense spacing. The Synapse Core is the visual anchor of the home screen; every other panel orbits it. Data arrives via `GET /api/state` snapshot + the `/api/events` SSE stream.

### Screen 1 — Mission Control (home)
```text
┌────────────────────────────────────────────────────────────────┐
│ ◆ FIELDSTONE AGENTIC OS        [pipeline] [agents] [vault] ⚙  │
├──────────────┬─────────────────────────────┬───────────────────┤
│ AGENT ROSTER │                             │  LIVE ACTIVITY    │
│ ● CEO   run  │       SYNAPSE CORE          │  12:04 audit ok   │
│ ● RES   run  │      (neural sphere)        │  12:03 draft #114 │
│ ○ CMO  idle  │                             │  12:01 skill+1    │
│ ● SLS   run  │   APPROVALS (3 waiting) ▼   │  (mono feed,      │
│ ○ ANL  idle  │                             │   150ms stagger)  │
│ ● DEV   run  │                             │                   │
├──────────────┴──────┬──────────┬───────────┴───────────────────┤
│ LEADS TODAY  ▂▄▆█   │ SENT 34  │ CONVERTED 3   │ SPEND $4.12   │
└─────────────────────┴──────────┴───────────────┴───────────────┘
```
- **Agent roster:** status dot uses semantic colors + a text label (`run/idle/fail`) — never color alone. Active agent panels get `.panel--active` glow.
- **Approvals queue:** the human gate. Each pending draft renders subject + body + QA score with Approve / Reject buttons — the day's 5-minute job. Skill review queue lives here too.
- **Live activity feed:** JetBrains Mono, newest on top, entries animate in with the 150ms stagger. Each feed event fires `synapseBus.emit('pulse', 3)`.
- **KPI strip:** stat tiles with mono numerals + tiny sparklines; SPEND tile reads the ledger.

### Screen 2 — Pipeline
- **Funnel chart** for `pending → audited → drafted → sent → converted` (5 sequential stages): single blue gradient `#0EA5E9 → #7DD3FC`, conversion % printed as text between every stage, biggest drop-off highlighted. Linear list fallback for accessibility.
- **Lead table:** dense rows (40px), mono data columns, status chips using semantic colors + labels; `failed` rows show `fail_reason`.

### Screen 3 — Agent Detail (`agents/[id]`)
- **Streaming area chart** for live token usage / actions-per-minute: Canvas-rendered, buffers last 300s, current pulse in `#38BDF8` with history fading to transparent. Requires a pause/resume control and a large mono "current value" KPI beside it (the chart is grade-B accessible on its own; the KPI text is the fallback).
- Prompt-constraint card (rendered from `profiles.json`) + last 20 outputs with CEO verdicts (approved/rejected + score + feedback).

### Screen 4 — Financial Growth
- **MRR milestone tracker:** M1 $1,995 → M2 $5,589 → M3 ~$10,783 as a labeled progress bar with current client mix beneath (counts × tier price).
- **Bullet chart grid** (not gauges — denser) for KPIs vs. target: open rate, reply rate, conversion, cost per converted client. Values always visible as text, ranges labeled with thresholds not color alone. Performance bar `#38BDF8`, target marker white.
- **Line chart** for MRR / pipeline value over time: primary series `#38BDF8`, comparison series distinguished by dash pattern *and* color. ≥1,000 points → Canvas + downsample.
- **Anomaly line** for delivery failures: normal `#38BDF8`, anomaly markers as red *circles* (shape + color) with a text annotation list beside the chart — driven by the Analytics Agent's >30% deviation flags.

### Chart rules (all screens)
- Legends + tooltips everywhere; hover states 150–300ms.
- Never rely on color alone: shapes, dash patterns, and text labels carry meaning redundantly.
- Reserve chart container space up-front (CLS < 0.1); skeleton shimmer while data loads.
- Recharts for SVG charts (< 1,000 pts); Canvas for streaming.

### Pre-Delivery Checklist (every screen ships against this)
- [ ] No emojis as icons — Lucide SVG only
- [ ] `cursor-pointer` + hover transition (150–300ms) on all clickables
- [ ] Text contrast ≥ 4.5:1 on glass panels (test against the *lightest* gradient stop)
- [ ] Visible focus rings (`--color-ring`) for full keyboard nav
- [ ] `prefers-reduced-motion` respected — sphere freezes, feeds stop animating
- [ ] Touch targets ≥ 44×44px; responsive at 375 / 768 / 1024 / 1440px, no horizontal scroll
- [ ] Streaming charts have pause controls; all live values mirrored as text KPIs

---
---

# PART VII — WORKSPACE LAYOUT & ENVIRONMENT

> ⚠️ **Location:** `C:\dev\fieldstone-workspace` — deliberately **outside OneDrive**. OneDrive sync on a live SQLite file is a known corruption vector. The marketing site repo can stay where it is; the engine cannot.

```text
C:\dev\fieldstone-workspace/
├── apps/
│   ├── dashboard/                  # NEXT.JS FRONTEND (UI/UX PRO LAYER)
│   │   ├── public/
│   │   └── src/
│   │       ├── styles/
│   │       │   └── tokens.css      # Deep Field design tokens (source of truth)
│   │       ├── components/
│   │       │   ├── SynapseCore.tsx # Neural sphere (Part V)
│   │       │   ├── GlassPanel.tsx  # Canonical panel wrapper
│   │       │   ├── AgentRoster.tsx # Status dots + labels
│   │       │   ├── ActivityFeed.tsx# Mono streaming feed
│   │       │   ├── ApprovalQueue.tsx # Human gate: drafts + skills
│   │       │   ├── KpiTile.tsx     # Stat tile + sparkline
│   │       │   └── charts/         # Funnel, Streaming, Bullet, TrendLine
│   │       ├── lib/
│   │       │   ├── synapseBus.ts   # Event bus: agent events → sphere pulses
│   │       │   └── api.ts          # /api/state fetcher + EventSource wiring
│   │       └── pages/              # mission-control, pipeline, agents/[id], growth
│   └── backend/                    # NODE.JS / TYPESCRIPT RUNTIME (CORE PROCESS)
│       ├── config/
│       │   └── profiles.json       # Agent system prompts (Part II)
│       ├── schema.sql              # Part III schema
│       ├── .env                    # secrets — never committed
│       ├── src/
│       │   ├── core/
│       │   │   ├── database.ts     # SQLite connection + migrations
│       │   │   ├── ledger.ts       # Budget caps + agent_runs recording
│       │   │   ├── memory.ts       # Episodic memory + skill registration
│       │   │   ├── events.ts       # SSE hub (/api/events)
│       │   │   └── orchestrator.ts # CEO pipeline loop (Part III)
│       │   ├── skills/
│       │   │   ├── base_skill.ts   # Safety contract (Part III)
│       │   │   ├── web_audit.ts    # Default site-bundle fetcher for Qwen
│       │   │   └── [auto_gen]/     # Dev Agent output — pending_review until human OK
│       │   ├── workers/
│       │   │   └── worker_router.ts# Ollama ↔ Anthropic routing + ledger
│       │   └── jobs/
│       │       ├── send.ts         # Throttled Resend dispatch (compliance checks)
│       │       ├── replies.ts      # Webhook/poll → Sales Rep classification
│       │       └── digest.ts       # 18:00 Analytics digest → DB + vault
│       └── package.json
└── vault/                          # LOCAL OBSIDIAN VAULT (PERSISTENT LOG STORAGE)
    ├── .obsidian/
    ├── System Operations/          # Daily structural agent tracking logs
    ├── Financial Growth/           # Daily digests, token ledger exports
    ├── Agent Skills/               # Approved skill source snapshots
    └── Backups/                    # Nightly SQLite .backup copies
```

### Environment Variables — `apps/backend/.env`

| Variable | Required | Purpose |
|----------|----------|---------|
| `AGENT_MODE` | — | `dry-run` (default) / `claude-code` (subscription, hard-stop) / `api` (pay-per-token) |
| `ALLOW_PAID_API` | — | Must be `true` for `api` mode to run at all — the anti-surprise-bill latch |
| `ANTHROPIC_API_KEY` | only for `api` mode | Cloud agents via pay-per-token API — optional if staying on `claude-code` |
| `RESEND_API_KEY` | ✅ | Outbound email + webhooks |
| `SEND_FROM` | ✅ | `sebastian@mail.fieldstone-webco.com` (subdomain protects root) |
| `CALENDAR_LINK` | ✅ | Booking link injected into positive-reply drafts |
| `BUSINESS_POSTAL_ADDRESS` | ✅ | CAN-SPAM footer — startup fails without it |
| `DAILY_TOKEN_BUDGET_USD` | — | Default `5` |
| `PER_LEAD_BUDGET_USD` | — | Default `0.25` |
| `QA_THRESHOLD` | — | CEO approve score, default `80` |
| `AUTO_APPROVE_THRESHOLD` | — | Phase 2+; default `999` (= off, human approves all) |
| `DAILY_SEND_CAP` | — | Warmup ramp control, default `10` |
| `OLLAMA_URL` | — | Default `http://localhost:11434` |
| `DISABLE_SKILLS` | — | Kill switch for the Skill Factory |

---
---

# PART VIII — BUILD ORDER & SETUP CHECKLIST

## 🔨 Build Order (each sprint ships something runnable)

**Sprint 1 — Engine skeleton (backend). ✅ SHIPPED (2026-07-18)** at `C:\dev\fieldstone-workspace\apps\backend`. `database.ts` + full schema · `worker_router.ts` with dry-run / claude-code / ollama / api paths (api gated behind double opt-in) · `ledger.ts` with daily + per-lead caps · orchestrator with QA loop + graceful budget pause · 10 seeded test leads. **Verified:** `npm run tick` moves leads `pending → audited → drafted` (9 drafted, 1 failed `no_flaws`, 2 QA-revision rounds exercised), ledger records tokens per agent at $0.0000, and a $0 cap cleanly pauses the engine without touching leads. Commands: `npm run seed` / `tick` / `status` / `reset`.

**Sprint 2 — Command Center shell (dashboard). ✅ SHIPPED (2026-07-18)** at `C:\dev\fieldstone-workspace\apps\dashboard`. Stack deviation from spec: **Vite + React 19 + Tailwind 4** instead of Next.js — matches the marketing site's stack, lighter for a local dashboard with no SSR need (Vite 6, since Node 20.16 predates Vite 8's requirements). Built: `tokens.css` (Deep Field), **Synapse Core** (420 Fibonacci nodes, single-draw-call synapse lines, 24 traveling pulses with burst mode, bloom, parallax rig, reduced-motion), Mission Control layout (roster / sphere / feed / approvals / KPI strip), backend `server.ts` on `:4600` (`/api/state`, `/api/events` SSE, `/api/approve|reject/:id`, `/api/tick`) with the orchestrator emitting live feed + pulse events. **Verified:** `POST /api/approve/6` flipped the lead `drafted → validated` and the SSE stream carried `feed: approved` + `pulse: n=5` (the sphere burst); a full tick streamed 21 live events. Run: `npm run serve` (backend) + `npm run dev` (dashboard) → http://localhost:5180.

**Sprint 2.5 — Cinematic upgrade + autonomy. ✅ SHIPPED (2026-07-18)** Visuals: layered starfield + perspective grid + breathing ambient glows + scanlines behind the whole UI; sphere gained a 1,200-particle inner nebula, two counter-rotating orbital rings, an energy-surge shell that flashes on every burst and decays, breathing scale, hotter bloom, film noise + vignette; HUD corner brackets on every panel. Autonomy: the server now **auto-ticks** (default 60s, `AUTO_TICK`/`AUTO_TICK_MS`) whenever leads are pending — agents run themselves; the human's only job is the approval queue, which now shows the audit evidence (flaw chips + severity) behind every draft the CEO queued. Agent click-through v1: roster click → slide-over with model, role, run totals, recent runs, prompt constraints (`GET /api/agents/:id`). **Verified:** restarting the server auto-processed 5 pending leads with zero human input.

**Sprint 3 — Real outreach. ✅ ENGINE COMPLETE (2026-07-18) — first real send day pending real leads.** Built and verified in mock mode: `jobs/send.ts` with suppression-at-dispatch, daily send cap, jitter between real sends, CAN-SPAM footer (postal address + plain-language opt-out) stamped at delivery; `SEND_MODE=mock` (default, $0, stamps the DB) vs `=resend` (requires key + postal address); **auto-send** — approved emails go out on the next engine cycle with no human step beyond the approval itself. Personalized demo links live end-to-end: every draft carries `?co=&trade=&fix=` and `Tier1WedgeDemo.jsx` on the marketing site now renders the prospect's company name and trade ("Your Preview"). Verified: approve → auto-send flipped a lead to `sent` with a stamped message ID. **Former blockers, completed 2026-07-18:** `SEND_MODE=resend` is live — the Resend key (send-only restricted) proven with a real test delivery through `mail.fieldstone-webco.com` (HTTP 200 → domain verified); Cal.com booking link + business postal address in `.env` (workspace only, never committed). **Reply pipeline shipped** (`jobs/replies.ts`): Sales Rep classifies incoming replies — pasted into the dashboard's Reply Desk today, or via `POST /api/webhooks/resend` once a tunnel is wired into Resend (handles delivered/opened/bounced/complained + inbound). Unsubscribe → instant suppression + lead failed; positive → SSE hot-lead alert (the push notification) + a follow-up draft carrying the calendar link, queued for a **human send click — follow-ups never auto-send**; bounce/complaint → suppression, plus a >5% daily-bounce circuit breaker that pauses all sends until `POST /api/send/resume`. **Pipeline screen shipped:** 5-stage funnel with stage-to-stage conversion % (biggest drop-off highlighted), Reply Desk, follow-up queue, dense lead table (status chips, fail reasons, opened/reply columns). Two new dispatch guards: test/example addresses can never reach the real API (`failed: test_address`), and canned dry-run drafts are **refused** for real delivery — real sends require `AGENT_MODE=claude-code`/`api` so the copy is model-written (verified: approve → send in resend+dry-run returns 0 sent with the refusal reason). Engineering note: better-sqlite3 v12 enforces foreign keys, so `reset.ts` now clears children first and detaches (not deletes) episodic memory. **Left for the first real send day:** import real leads (CSV — still the open decision), flip `AGENT_MODE=claude-code`, and optionally tunnel the webhook URL into Resend for automatic open/bounce/reply tracking (the send-only key cannot poll message status). **Visual proof strategy (the "best emails" mandate):** first-touch emails stay *plain-text-looking* — image-heavy cold emails get spam-filtered and Gmail hides images from unknown senders — but each one links to a **personalized demo page**: a per-lead variant of the existing `/demo/` mocks rendered with the prospect's company name, trade, and their audit's top flaw fixed ("we already built your preview"). The CMO prompt gains a `{{personal_demo_link}}` variable; a small generator stamps lead params onto the Tier-1 demo route. Full visual mockups (screenshots, before/after images) go in the **reply follow-up**, where deliverability no longer gates them. **Done when:** first real 10-email day completes with events visible end-to-end and every email links to a working personalized demo.

**Sprint 4 — Intelligence. ✅ SHIPPED (2026-07-18, one item deferred).** Analytics digest job (`jobs/digest.ts`): funnel + cost + deliverability + anomalies → `daily_metrics` row, dashboard, **and the Obsidian vault** (`vault/Financial Growth/YYYY-MM-DD.md` — verified written); auto-runs at 18:00, manual via `POST /api/digest` or the Growth screen's "run now". **Growth screen** (second dashboard view): MRR milestone tracker (M1/M2/M3 progress bar), funnel tiles, tokens/day trend chart (Recharts), digest panel, and the **Skill Factory review queue** — pending skills render their full source; Approve & activate / Disable buttons enforce the human gate (verified: sample skill flipped `pending_review → active`). `base_skill.ts` contract file in place. Agent Detail v2: token-usage area chart per agent + the CEO's verdict history (score, company, human outcome). *Deferred:* a real Dev-Agent-written skill executing at runtime — needs claude-code mode live.

**Sprint 4.5 — Dev Agent runs on real memory, not a template. ✅ SHIPPED (2026-07-19).** `core/memory.ts` implements the blueprint's episodic-memory contract for real: every lead failure and every CEO QA rejection is committed with its reason and evidence as it happens (`orchestrator.ts` wired in). `jobs/dev_agent.ts` reads that memory before proposing anything — `detectGap()` checks real counts (`qa_reject`, `fail:*`) against which skills already exist, so it never proposes a duplicate and never fires on a fixed schedule alone. Three gap templates encode genuine product needs, in priority order: **draft_prescreen** (fires after 2+ real QA rejections on the banned-phrase rule — cuts the CMO↔CEO round trip), **domain_reachability_check** (fires on a suppressed/failed send traced to a dead domain — protects sender reputation per the Risk Register), **lead_enrichment** (the always-available fallback tied to Part I's open "lead sourcing" decision). Generated code writes to a real file on disk (`src/skills/auto_gen/<name>.ts`) *and* a `system_skills` row — both required before it's reviewable; nothing executes until approved. **Verified live:** two ticks produced 2 real QA rejections → running the Dev Agent proposed `draft_prescreen` (not the fallback), the generated file matched the actual banned-phrase list from the CMO prompt, and approving it flipped `pending_review → active` through the same review-gate endpoint as before. Runs weekly (Sunday, checked hourly) or on demand via the Growth screen's "run Dev Agent" button. In `claude-code`/`api` mode this same code path hands the identical gap + evidence context to a real model instead of the template — no separate wiring needed.

**📦 Repo integration — ✅ DONE (2026-07-19).** The engine now lives inside this same git repo at [`apps/`](apps/) (source only — `node_modules`/`.env`/`*.db`/`dist` gitignored), separate from the marketing site in `src/`. `apps/README.md` is the co-founder's setup guide (install steps, the cost-model table, Obsidian vault instructions); the root `README.md` links to it and to this file. **Whoever picks this up should read `Master_Blueprint.md` first, then `apps/README.md`.** Nothing has been pushed yet as of this entry — commit/push is a deliberate separate step (see chat for confirmation before it happens).

**🌐 Custom-domain cutover + reply path — ✅ DONE (2026-07-18).** `fieldstone-webco.com` (Porkbun DNS → GitHub Pages) was serving a **white page**: the site was built with `base: '/fieldstone-web-co/'` for the github.io subpath, so on the custom domain every asset 404'd. Fixed — `base: '/'` always, `public/CNAME` added so `npm run deploy` keeps the domain bound, redeployed and verified (assets 200, `/about/` 200, personalized demo route 200; old github.io URLs 301-redirect so links in already-drafted emails survive). `SITE_BASE` now defaults to the branded domain — cold emails link `fieldstone-webco.com`, not github.io. Second finding: **`mail.fieldstone-webco.com` has no MX record**, so prospect replies to the From address would bounce. Interim fix shipped: `REPLY_TO` env var (Resend `reply_to` header), currently routing replies to Sebastian's Gmail; the proper fix (Resend inbound or Porkbun forwarding + MX) is on the open-items list. Deliverability test #2 sent to both founders with the reply path live.

**🖥️ Second-machine onboarding (co-founder pickup) — ✅ DONE (2026-07-18).** The engine now runs on the second dev machine. Two setup gaps found and fixed in-repo: (1) `apps/README.md` says `cp .env.example .env`, but `.env.example` had never been committed — the root `.gitignore`'s `.env.*` pattern swallowed it. Restored with all-safe defaults (`dry-run`, `mock`, auto-tick on) covering every env var the code reads, plus a `!.env.example` gitignore exception. (2) `better-sqlite3@^11` ships no prebuilt binary for Node 24 (this machine runs 24.12.0), and the source-build fallback needs the VS C++ toolset — bumped to `^12.11.1`, which has prebuilds for Node 20+ so the original machine (Node 20.16) is unaffected. Run workspace created at `C:\dev\fieldstone-workspace` per the README warning — note the repo itself sits inside an Obsidian vault with the Sync core plugin enabled, so running the engine next to the repo would put a live SQLite file under a sync client. **Verified on this machine:** `seed → tick` moved 10 leads (9 drafted with 2 QA-revision rounds visible, 1 failed `no_flaws`), `POST /api/approve/1` flipped `drafted → validated`, the send job mock-stamped it `sent`, and the dashboard on `:5180` serves with the `/api` proxy live. One behavior worth knowing: auto-send runs on the 60s auto-tick interval (`server.ts`), not inside `POST /api/tick` — use `POST /api/send` to flush validated emails immediately.

**Sprint 5 — Synapse Immersion (the sphere becomes the interface).** Click the sphere → it takes over the screen and the camera **flies through the membrane** (dolly through the node shell with bloom flare). Inside: the org rendered spatially — **CEO node at the top**, worker agents arranged below, live pulse traffic flowing between them along the actual pipeline edges. Click a worker → its detail panel in-world (current task, last runs, live tokens). Click the CEO → the **CEO command dashboard**: overrides everything — approve/reject queue, budget and send caps, pause/resume any agent, mode switching. Escape backs the camera out. Reuses the existing Three.js scene graph + `/api` surface; new work is the camera choreography and the in-world hierarchy layout.

**Sprint 6 — JARVIS (implement LAST).** Talk to the sphere. A conversation interface bound to the CEO agent with tool access to the engine's whole API (state, approvals, caps, digest, skills) — "how did we do this week?", "approve the Comfort King draft", "pause sends." Voice in/out via the Web Speech API first (free, local), upgradeable later. Runs in `claude-code` mode on the subscription — same hard-stop cost model as everything else. Prereq: Sprints 3–5 stable, real send data flowing.

## ✅ Setup Checklist — What We Need From You

### Accounts & keys
1. **Anthropic API key** → `ANTHROPIC_API_KEY` in `apps/backend/.env`.
2. **Resend account + API key** → delivery + open/reply webhooks.
3. **`fieldstone-webco.com` domain** — purchase, then verify `mail.` subdomain in Resend (SPF, DKIM, DMARC). The single biggest deliverability lever.
4. **Booking link** (Cal.com free tier or Calendly) → `CALENDAR_LINK`.
5. **Business postal address** for the CAN-SPAM footer (a UPS Store box works).

### Local machine (one-time)
6. **Ollama** + `ollama pull qwen2.5-coder:7b` (`:14b` if GPU ≥ 12GB VRAM) — makes the Researcher $0/token.
7. **Obsidian** installed, vault at `C:\dev\fieldstone-workspace\vault\`.
8. **Windows Task Scheduler** entries (we'll script these): orchestrator tick 07:00, send window 09:30, digest 18:00, nightly DB backup.

### Dependencies (installed during scaffolding)
```bash
# dashboard
npm i three @react-three/fiber @react-three/drei @react-three/postprocessing maath
npm i framer-motion lucide-react recharts
# backend
npm i better-sqlite3 @anthropic-ai/sdk resend
```

### Decisions still open (pick when ready)
- **Lead sourcing:** manual CSV to start (recommended — 50 hand-picked KC-metro shops beats 500 scraped), Google Maps scraping as the first auto-generated Skill, or a purchased list.
- **Auto-approve timing:** when (if ever) to lower `AUTO_APPROVE_THRESHOLD` from "human approves everything."
- **Dashboard access from phone:** stays local (free, $0-footprint) or gets tunneled behind auth (e.g., Cloudflare Tunnel, still free).

---

*Design system generated with UI/UX Pro Max (style: Modern Dark cinematic · dials: variance 7 / motion 8 / density 8). Palette adapted from the dark-dashboard family with the accent family swapped to electric blue per brand direction; Three.js implementation follows the stack's particle, buffer-update, and tone-mapping rules. Tier pricing sourced from the live site (`src/components/TradePlans.jsx`). Funnel benchmarks are conservative industry ranges — the Analytics Agent replaces them with measured actuals.*
