# Fieldstone Web Co — Company Site

Marketing site built with Vite, React 19, Tailwind CSS 4, and Framer Motion.
Two pages: the main landing page (`/`) and a standalone about page (`/about/`),
built as a Vite multi-page app — no client-side router.

**Live site:** https://fieldstone-webco.com (the old
sebastianalturckcarlos.github.io/fieldstone-web-co/ URLs 301-redirect here)

## Run it locally

```bash
npm install
npm run dev      # opens on http://localhost:5173
```

## Build & deploy

```bash
npm run build    # outputs static site to dist/
npm run deploy   # builds + publishes dist/ to GitHub Pages (needs a git repo with a remote)
```

The `dist/` folder is plain static files — it also works on Netlify, Vercel, Cloudflare Pages, etc.

## Client demos (hidden routes)

Product mocks for prospects live under `/demo/` — unlisted, `noindex`, shared by link only.
`/demo/` itself is an internal launcher page listing every mock.

| Tier | Route | Component |
| --- | --- | --- |
| 1 — Operations Kickstart | `/demo/tier1-wedge/` | `src/demos/Tier1WedgeDemo.jsx` |
| 2 — Growth CRM Suite | `/demo/tier2-crm/` | `src/demos/Tier2CRMDemo.jsx` |
| 3 — Custom Enterprise Architecture | `/demo/tier3-enterprise/` | `src/demos/Tier3EnterpriseDemo.jsx` |

Naming convention: route `demo/tier<N>-<product>/index.html` ↔ component
`src/demos/Tier<N><Product>Demo.jsx` ↔ entry `src/demos/tier<N>-<product>.jsx`.
To add one: copy an existing trio, then register the new `index.html` in
`vite.config.js` under `build.rollupOptions.input` and add a card to `demo/index.html`.

## Editing business info

Everything (socials, pricing, service areas, quote email) lives in [src/config.js](src/config.js).
Change it there and it updates across the whole site.

## Quote form

The contact form posts to FormSubmit (free) and delivers to the email in `config.js`.
**One-time setup:** submit the form once, then click the confirmation link FormSubmit emails you.
Every request after that lands straight in the inbox. If sending ever fails, the visitor's
email app opens pre-filled as a fallback, so no lead is lost.

## Logo

The logo is code, not an image — three stacked fieldstones forming an "F"
([src/components/Logo.jsx](src/components/Logo.jsx), mirrored in [public/favicon.svg](public/favicon.svg)).

---

## Agentic OS — the internal client-acquisition engine

This repo also holds a second, unrelated project: an automated engine that
researches trade-services prospects, drafts personalized outreach, and runs
a dashboard to supervise it — completely separate code from the site above,
living in its own top-level folder so the two never mix.

- **Code:** [`apps/`](apps/) — a Node/TypeScript backend + a Vite/React/Three.js
  dashboard (the folder's own [`apps/README.md`](apps/README.md) has full setup
  instructions, the cost-safety model, and an Obsidian vault guide).
- **The plan:** [`Master_Blueprint.md`](Master_Blueprint.md) is the living design
  doc — business model, agent prompts, database schema, design system, and a
  sprint-by-sprint build log (what's shipped, in progress, or still ahead).

**If you're picking this up fresh:** read `Master_Blueprint.md` first, then
`apps/README.md` to get it running locally. Both files are meant to be kept
up to date as the build continues — treat them as the shared source of truth
rather than asking what's been done so far.

## Project Context — day-to-day work logs

[`Project Context/`](Project%20Context/) holds the dated work logs and
reference notes (site map, decisions, gotchas) — the "what happened and why"
layer between commits and the blueprint. One file per working day; see the
folder's own README for the convention. Keep it updated as you work.
