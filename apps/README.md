# Fieldstone Agentic OS — Engine + Dashboard

This is the internal client-acquisition engine, separate from the marketing
site in `../src`. It runs locally (no hosting cost) and automates the
research → outreach → follow-up pipeline described in `../Master_Blueprint.md`.

**Start here:** read `../Master_Blueprint.md` top to bottom before touching
code — it's the design doc, the sprint history, and the decision log all in
one place. Everything below is the "how do I actually run it" complement to
that document.

## ⚠️ Before you run anything: move this out of cloud sync

If your clone of this repo lives inside OneDrive, Dropbox, iCloud Drive, or
Google Drive, **do not run the engine from inside that folder.** The backend
writes a live SQLite database (WAL mode) to disk continuously while it runs,
and a cloud-sync client trying to upload that file mid-write is a well-known
corruption vector.

```bash
# Clone (or copy) this folder tree somewhere NOT cloud-synced first, e.g.:
#   Windows: C:\dev\fieldstone-workspace
#   Mac/Linux: ~/dev/fieldstone-workspace
git clone https://github.com/SebastianAlturckCarlos/fieldstone-web-co.git
# then work out of <clone>/apps/backend and <clone>/apps/dashboard from there,
# or symlink/copy just the apps/ folder to your local dev path.
```

The website (`../src`) has no live-database problem — it's static — so it's
fine to keep that part in OneDrive/Dropbox/etc. Only the **running instance**
of the engine needs to live outside cloud sync. The *source code* here in
the git repo is fine wherever the repo lives; it's only a problem once you
`npm run serve` and a live `.db` file starts getting written next to it.

## What's here

```
apps/
├── backend/     Node + TypeScript + better-sqlite3 — the agent engine
└── dashboard/   Vite + React + Three.js — Mission Control UI (the sphere)
```

Both are git-tracked for source; `node_modules/`, `.env`, `*.db`, `dist/`,
and `serve.log` are gitignored — you'll generate all of those locally.

## First-time setup

```bash
cd apps/backend
npm install
cp .env.example .env        # defaults are already safe — see cost model below
npm run seed                 # 10 sample KC-metro leads + 1 sample skill
npm run serve                 # starts the engine API on :4600, auto-ticks itself

# in a second terminal
cd apps/dashboard
npm install
npm run dev                   # opens on :5180, proxies /api to :4600
```

Open **http://localhost:5180**. The engine is fully autonomous — it ticks
itself every 60s whenever leads are pending, drafts, QA-loops, and sends
approved mail with no clicking required. Your job is the **CEO tab**
(the crown button, or click CEO anywhere): read what the agents queued,
approve or reject.

### Branded snapshot previews (needs Chrome or Edge)

Outreach emails no longer link to the live demo — each one **embeds a
screenshot** of the prospect's operations screen mocked up in their own
brand colors and logo (scraped during the audit). Rendering uses
`puppeteer-core` driving the Chrome or Edge **already installed on your
machine** — nothing extra to download. If neither is in a standard install
path, set `SNAPSHOT_BROWSER_PATH` in `.env`. No browser found = the engine
logs it once and emails ship as clean text; nothing breaks. PNGs land in
`apps/backend/snapshots/` (gitignored), served at
`/api/snapshots/{leadId}.png`, and shown on every approval card so you see
exactly what the prospect will see before you approve.

## The cost model — read this before changing `AGENT_MODE`

`apps/backend/.env` controls which "brain" the agents use. **The default
(`dry-run`) costs nothing and touches no network.** Two other modes exist:

| `AGENT_MODE` | What happens | Cost |
|---|---|---|
| `dry-run` (default) | Canned mock outputs, deterministic, no network | **$0, always** |
| `claude-code` | Shells out to your installed `claude` CLI — runs on your **Claude subscription** | $0 beyond the subscription. **Hits your usage limit → stops working. Never bills extra.** |
| `api` | Anthropic API key, pay-per-token | **Real money.** Refuses to run unless you set BOTH `ALLOW_PAID_API=true` and `ANTHROPIC_API_KEY` in `.env` — this is a deliberate double opt-in so it can never trigger by accident. |

If you're just exploring the dashboard or testing a change, leave
`AGENT_MODE=dry-run`. Only switch to `claude-code` when you want to see real
agent-written copy, and only touch `api` mode if you've explicitly decided to
pay per token (check current Anthropic pricing first — rates in
`src/core/config.ts` are a cap-estimate table, not a live price feed).

## Useful commands

```bash
# backend (apps/backend)
npm run seed     # load 10 sample leads + 1 sample pending skill
npm run tick     # run one orchestrator pass from the CLI (debugging only — the server ticks itself)
npm run status   # print pipeline/ledger state to the terminal
npm run reset    # wipe leads/drafts/ledger back to empty (does NOT touch skills or memory)
npm run serve    # start the HTTP/SSE API the dashboard talks to (:4600)

# dashboard (apps/dashboard)
npm run dev      # dev server with hot reload (:5180)
npm run build    # production build -> dist/
```

## What the dashboard shows

- **Mission Control** — deliberately minimal: the header and a full-screen
  Synapse Core sphere, nothing else (agent activity as light; **click it to
  fly inside** — the org rendered spatially with full agent nameplates, Esc
  to exit). When decisions are waiting, one floating pill appears over the
  sphere. Everything operational lives in the CEO tab.
- **CEO tab** (crown button — your actual job) — the approval queue with
  the full agent chain behind every draft (Researcher audited · CMO drafted ·
  CEO scored · Sales Rep consulted) **and the exact branded preview image
  embedded in that email**, the follow-up queue, the agent roster, the live
  activity feed, the KPI strip, pause/resume sends, and digest / Dev Agent
  triggers.
- **Pipeline** — a clickable Kanban board (click any lead card for the full
  drill-down: audit evidence, captured brand colors + logo, the snapshot as
  sent, drafts with verdicts, and the agent-run timeline), plus the funnel
  with conversion % between stages and the Reply Desk (paste a prospect
  reply → the Sales Rep classifies it).
- **Growth** — MRR milestone tracker, funnel counts, token-usage trend, the
  daily Analytics digest (also written to `vault/Financial Growth/` if you
  set up an Obsidian vault — see below), and the **Skill Factory** review
  queue: code the Dev Agent writes for itself, which never runs until a human
  reads it and clicks Approve.
- **JARVIS** (header toggle) — talk to the engine: status questions and
  commands ("approve the Comfort King draft", "pause sends"), voice in/out
  via the browser's speech API. Actions run through a whitelist — it can do
  nothing a dashboard button can't.

Performance note: the sphere auto-tunes itself (full cinema → lean → static)
based on measured frame rate and remembers the choice per browser — a weak
GPU gets a clean static frame instead of a slideshow. The tiny `q2 · 60fps`
readout under the sphere shows which tier you're on.

## Setting up your own Obsidian vault (optional but recommended)

The blueprint's design has the engine write daily digests to a vault folder
so there's a permanent, searchable log outside the database. To wire this up
on your machine:

1. Install Obsidian, open it, and "Open folder as vault" pointed at
   `<your-local-workspace-path>/vault` (create the folder first if it
   doesn't exist — `apps/backend/src/jobs/digest.ts` writes to
   `<workspace>/vault/Financial Growth/YYYY-MM-DD.md`).
2. That's it — no plugin needed. It's just markdown files landing on disk;
   Obsidian is a viewer over the folder, not a service the engine talks to.
3. If your local workspace path differs from the default
   (`C:\dev\fieldstone-workspace` on Windows), update `VAULT_DIR` in
   `apps/backend/src/jobs/digest.ts` to match.

## Continuing the build

`../Master_Blueprint.md` is the living plan — every sprint's status (shipped
vs. in-progress vs. deferred) is recorded there as it happens, along with the
full agent prompts, database schema, design tokens, and the roadmap. Sprints
1 through 8 have all shipped (Part VIII has the record per sprint; Sprint 8
is the command-center UX + branded-snapshot outreach pivot). The dated logs
in `../Project Context/` are the session-by-session history. When you pick
up work, update both the same way as you go — they're the shared source of
truth between whoever is building this.
