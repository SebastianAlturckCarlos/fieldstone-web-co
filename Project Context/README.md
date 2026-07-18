# Project Context

The shared working memory for Fieldstone Web Co — day-by-day work logs and
reference notes that don't belong in code or in `../Master_Blueprint.md`
(which stays the design doc + sprint log for the Agentic OS).

This folder is **git-tracked on purpose**: it used to live one level up in
the Obsidian vault, outside the repo, which meant a `git clone` gave you the
code and the blueprint but none of the day-to-day context. Moved into the
repo 2026-07-18 so anyone with repo access gets the full picture. The repo
sits inside the Obsidian vault, so Obsidian still indexes these notes and
`[[wiki-links]]` between them keep working — edit them in Obsidian or any
editor, then commit like everything else.

## Convention

- **`YYYY-MM-DD Work Log.md`** — one file per working day: what changed, why,
  gotchas learned, and an "Open items" checklist at the bottom. Write it the
  same day; link related notes with `[[Note Name]]`.
- **Reference notes** (e.g. `Site Map & Routes.md`) — living documents;
  update in place rather than duplicating.
- Don't put secrets here (keys, credentials, client PII) — the repo is
  public. Secrets live in `.env` files, which are gitignored.
