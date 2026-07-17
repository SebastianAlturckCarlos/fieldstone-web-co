# Fieldstone Web Co — Company Site

Marketing site built with Vite, React 19, Tailwind CSS 4, and Framer Motion.
Two pages: the main landing page (`/`) and a standalone about page (`/about/`),
built as a Vite multi-page app — no client-side router.

**Live site:** https://sebastianalturckcarlos.github.io/fieldstone-web-co/

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
