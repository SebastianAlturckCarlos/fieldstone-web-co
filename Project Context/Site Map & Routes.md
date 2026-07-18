# Site Map & Routes

Quick reference for the Fieldstone Web Co site. History of how it got here: [[2026-07-17 Work Log]].

**Live base URL:** https://sebastianalturckcarlos.github.io/fieldstone-web-co/
**Repo:** `Fieldstone/fieldstone-web-co` (this vault's subfolder) · deployed via `npm run deploy` (GitHub Pages)

## Public pages
| Route | Purpose | Key files |
|---|---|---|
| `/` | Main landing funnel | `src/App.jsx` + `src/components/*` |
| `/about/` | Team & company background | `src/AboutPage.jsx`, `about/index.html` |

## Hidden demo routes (noindex, link-only)
| Route | Product | Component |
|---|---|---|
| `/demo/` | Internal launcher (all mocks) | `demo/index.html` (static) |
| `/demo/tier1-wedge/` | Fieldstone Wedge — dispatch + fast quote | `src/demos/Tier1WedgeDemo.jsx` |
| `/demo/tier2-crm/` | Fieldstone Growth CRM — owner dashboard | `src/demos/Tier2CRMDemo.jsx` |
| `/demo/tier3-enterprise/` | Fieldstone Custom Enterprise — field↔office POS sync | `src/demos/Tier3EnterpriseDemo.jsx` |

Naming convention: `demo/tier<N>-<product>/index.html` ↔ `src/demos/Tier<N><Product>Demo.jsx` ↔ entry `src/demos/tier<N>-<product>.jsx` — register new entries in `vite.config.js`.

## Landing page sections (in order)
Navbar · Hero · Marquee · PainPoints (`#why`) · Platform (`#platform`) · Security (`#security`) · TradePlans (`#plans`) · Process (`#process`) · Quote/contact form (`#contact`) · Footer

## Config knobs
- `src/config.js` — business name, tagline, socials, contact email, service areas
- Pricing lives in `src/components/TradePlans.jsx` (TIERS array)
- Demo sample data lives at the top of each demo component

## Commands
```bash
npm run dev      # local dev — localhost:5173
npm run build    # static build to dist/
npm run deploy   # build + publish to GitHub Pages
```
