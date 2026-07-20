// Renders the personalized "your operations screen" mockup as one
// self-contained HTML string — the thing the snapshot engine screenshots and
// the email embeds. Modeled on the Tier-1 Wedge demo (src/demos/
// Tier1WedgeDemo.jsx on the marketing site) but deliberately dependency-free:
// no React, no Tailwind build, no webfonts — it must render identically in a
// headless browser with zero network beyond the prospect's logo.
import type { BrandBundle } from './brand_extract.js'

export interface MockupOptions {
  company: string
  trade: string
  city: string
  brand: BrandBundle | null
  topFlawType?: string | null   // the audit's #1 flaw — the mockup shows it solved
}

const FALLBACK_PRIMARY = '#2563eb' // Fieldstone blue — used only when a site yields no brand

function rgb(hex: string): [number, number, number] {
  const h = hex.slice(1)
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
const toHex = (c: [number, number, number]) =>
  '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
const mix = (hex: string, target: number, ratio: number) =>
  toHex(rgb(hex).map(v => v + (target - v) * ratio) as [number, number, number])

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Trade-authentic sample jobs — the board must read like THEIR Tuesday,
// not like a generic SaaS screenshot.
const JOBS_BY_TRADE: Record<string, [string, string, string, string, string][]> = {
  hvac: [
    ['7:00 AM', 'Seasonal Maintenance', '33 Landon Pl', 'John D.', 'Completed'],
    ['8:00 AM', 'A/C Repair', '123 Main St', 'John D.', 'On Site'],
    ['9:30 AM', 'Furnace Tune-Up', '448 Oakwood Dr', 'Maria G.', 'En Route'],
    ['10:15 AM', 'Compressor Replacement', '2210 Harvest Ln', 'Dave R.', 'Scheduled'],
    ['11:00 AM', 'Thermostat Install', '87 Birchwood Ct', '', 'Unassigned'],
    ['3:00 PM', 'No Cooling — Emergency', '764 Elmhurst Ave', '', 'Emergency'],
  ],
  plumbing: [
    ['7:00 AM', 'Water Heater Flush', '33 Landon Pl', 'John D.', 'Completed'],
    ['8:00 AM', 'Slab Leak Locate', '123 Main St', 'John D.', 'On Site'],
    ['9:30 AM', 'Sump Pump Replacement', '448 Oakwood Dr', 'Maria G.', 'En Route'],
    ['10:15 AM', 'Repipe Estimate', '2210 Harvest Ln', 'Dave R.', 'Scheduled'],
    ['11:00 AM', 'Garbage Disposal Install', '87 Birchwood Ct', '', 'Unassigned'],
    ['3:00 PM', 'Burst Pipe — Emergency', '764 Elmhurst Ave', '', 'Emergency'],
  ],
  electrical: [
    ['7:00 AM', 'Panel Inspection', '33 Landon Pl', 'John D.', 'Completed'],
    ['8:00 AM', 'EV Charger Install', '123 Main St', 'John D.', 'On Site'],
    ['9:30 AM', 'Ceiling Fan Wiring', '448 Oakwood Dr', 'Maria G.', 'En Route'],
    ['10:15 AM', '200A Service Upgrade', '2210 Harvest Ln', 'Dave R.', 'Scheduled'],
    ['11:00 AM', 'Outlet & GFCI Swap', '87 Birchwood Ct', '', 'Unassigned'],
    ['3:00 PM', 'Power Out — Emergency', '764 Elmhurst Ave', '', 'Emergency'],
  ],
}

const STATUS_CSS: Record<string, string> = {
  Completed: 'background:#f1f5f9;color:#64748b',
  'On Site': 'background:#ecfdf5;color:#047857',
  'En Route': 'background:var(--brand-soft);color:var(--brand-dark)',
  Scheduled: 'background:#f1f5f9;color:#475569',
  Unassigned: 'background:#fffbeb;color:#b45309',
  Emergency: 'background:#fef2f2;color:#b91c1c',
}

// The metric row leads with the pain the audit found, framed as solved.
function metricsFor(topFlawType: string | null | undefined, trade: string) {
  const captureMetric = topFlawType === 'conversion' || topFlawType === 'mobile'
    ? ['After-Hours Calls Captured', '6', 'Booked while you slept — zero missed']
    : ['Active Jobs Today', '14', '+3 vs. yesterday']
  return [
    captureMetric,
    ['Pending Quotes', '7', '2 expiring within 48h'],
    ['Unassigned Techs', '3', 'Assign from the board below'],
  ]
}

export function renderMockupHtml(opts: MockupOptions): string {
  const primary = opts.brand?.primary_color ?? FALLBACK_PRIMARY
  const brandDark = mix(primary, 0, 0.25)
  const brandSoft = mix(primary, 255, 0.9)
  const company = esc(opts.company)
  const tradeKey = /plumb/i.test(opts.trade) ? 'plumbing' : /elect/i.test(opts.trade) ? 'electrical' : 'hvac'
  const jobs = JOBS_BY_TRADE[tradeKey]
  const initials = esc(opts.company.split(/\s+/).map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || 'OP')
  const logo = opts.brand?.logo_url
    ? `<img src="${esc(opts.brand.logo_url)}" alt="" style="height:30px;max-width:120px;object-fit:contain"
         onerror="this.style.display='none';document.getElementById('logo-fallback').style.display='flex'">
       <div id="logo-fallback" style="display:none" class="logo-badge">${initials}</div>`
    : `<div class="logo-badge">${initials}</div>`

  const metricCards = metricsFor(opts.topFlawType, opts.trade).map(([label, value, note]) => `
    <div class="card metric">
      <p class="metric-label">${label}</p>
      <p class="metric-value">${value}</p>
      <p class="metric-note">${note}</p>
    </div>`).join('')

  const jobRows = jobs.map(([time, title, addr, tech, status]) => `
    <li class="job">
      <span class="job-time">${time}</span>
      <div class="job-main">
        <p class="job-title${status === 'Completed' ? ' done' : ''}">${title}</p>
        <p class="job-addr">${addr} · ${esc(opts.city)}</p>
      </div>
      ${tech
        ? `<span class="job-tech">${tech}</span>`
        : `<span class="assign-btn">Assign Tech</span>`}
      <span class="chip" style="${STATUS_CSS[status]}">${status}</span>
    </li>`).join('')

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<style>
  :root { --brand:${primary}; --brand-dark:${brandDark}; --brand-soft:${brandSoft}; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',system-ui,-apple-system,Arial,sans-serif; background:#f1f5f9;
         color:#0f172a; width:1360px; -webkit-font-smoothing:antialiased; }
  .app { display:flex; min-height:760px; }
  .sidebar { width:64px; background:#0f172a; display:flex; flex-direction:column; align-items:center;
             padding:16px 0; gap:10px; }
  .logo-badge { width:40px; height:40px; border-radius:12px; background:var(--brand); color:#fff;
                display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; }
  .nav-dot { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; }
  .nav-dot svg { width:20px; height:20px; stroke:#94a3b8; }
  .nav-dot.active { background:var(--brand); } .nav-dot.active svg { stroke:#fff; }
  .main { flex:1; display:flex; flex-direction:column; min-width:0; }
  .header { display:flex; align-items:center; gap:14px; background:#fff; border-bottom:1px solid #e2e8f0;
            padding:14px 24px; }
  .header h1 { font-size:19px; font-weight:650; }
  .badge { background:var(--brand-soft); color:var(--brand-dark); font-size:10px; font-weight:700;
           text-transform:uppercase; letter-spacing:.06em; border-radius:999px; padding:3px 10px; }
  .header .sub { font-size:12px; color:#64748b; margin-top:2px; }
  .avatar { margin-left:auto; width:36px; height:36px; border-radius:999px; background:#e2e8f0;
            display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:600; color:#475569; }
  .content { display:flex; gap:16px; padding:24px; }
  .col { flex:1; min-width:0; display:flex; flex-direction:column; gap:16px; }
  .card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; box-shadow:0 1px 2px rgba(15,23,42,.05); }
  .metrics { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; }
  .metric { padding:18px 20px; }
  .metric-label { font-size:13px; color:#64748b; font-weight:500; }
  .metric-value { font-size:30px; font-weight:750; letter-spacing:-.02em; margin-top:6px; }
  .metric-note { font-size:11px; margin-top:4px; color:var(--brand-dark); font-weight:600; }
  .board-head { display:flex; align-items:center; justify-content:space-between; padding:16px 20px;
                border-bottom:1px solid #e2e8f0; }
  .board-head h2 { font-size:15px; font-weight:650; }
  .filters { display:flex; gap:6px; }
  .filter { font-size:11px; font-weight:600; border-radius:999px; padding:4px 12px; background:#f1f5f9; color:#475569; }
  .filter.active { background:#0f172a; color:#fff; }
  .jobs { list-style:none; }
  .job { display:flex; align-items:center; gap:16px; padding:13px 20px; border-bottom:1px solid #f1f5f9; }
  .job:last-child { border-bottom:none; }
  .job-time { width:64px; font-size:12px; font-weight:650; color:#64748b; flex-shrink:0; }
  .job-main { flex:1; min-width:0; }
  .job-title { font-size:14px; font-weight:600; }
  .job-title.done { color:#94a3b8; }
  .job-addr { font-size:11px; color:#64748b; margin-top:2px; }
  .job-tech { font-size:13px; color:#475569; }
  .assign-btn { font-size:11px; font-weight:700; color:var(--brand-dark); background:var(--brand-soft);
                border:1px solid var(--brand); border-radius:8px; padding:6px 12px; }
  .chip { font-size:11px; font-weight:600; border-radius:999px; padding:4px 10px; }
  .quote { width:300px; flex-shrink:0; padding:20px; align-self:flex-start; }
  .quote h2 { font-size:15px; font-weight:650; margin-bottom:4px; }
  .quote .hint { font-size:11px; color:#64748b; margin-bottom:16px; }
  .field-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.05em;
                 color:#64748b; margin:12px 0 5px; }
  .field { border:1px solid #e2e8f0; background:#f8fafc; border-radius:8px; padding:9px 12px;
           font-size:13px; color:#475569; }
  .estimate { background:var(--brand-soft); border:1px solid var(--brand); border-radius:10px;
              padding:12px 14px; margin-top:14px; }
  .estimate .cap { font-size:11px; font-weight:600; color:var(--brand-dark); }
  .estimate .amt { font-size:19px; font-weight:750; color:var(--brand-dark); margin-top:2px; }
  .send-btn { margin-top:14px; background:var(--brand); color:#fff; border-radius:9px; text-align:center;
              font-size:13px; font-weight:650; padding:12px; }
</style></head>
<body><div class="app">
  <nav class="sidebar">
    ${logo}
    <div class="nav-dot active"><svg fill="none" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg></div>
    <div class="nav-dot"><svg fill="none" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg></div>
    <div class="nav-dot"><svg fill="none" stroke-width="2" viewBox="0 0 24 24"><path d="M10 17h4V5H2v12h3m5 0H8m11 0h2v-6l-3-5h-4v11h1"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/></svg></div>
    <div class="nav-dot"><svg fill="none" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
  </nav>
  <div class="main">
    <header class="header">
      <div>
        <div style="display:flex;align-items:center;gap:10px">
          <h1>${company}</h1>
          <span class="badge">Your Preview · Sample Data</span>
        </div>
        <p class="sub">What ${esc(opts.trade || 'your')} dispatch could look like — built by Fieldstone Web Co</p>
      </div>
      <div class="avatar">${initials}</div>
    </header>
    <main class="content">
      <div class="col">
        <section class="metrics">${metricCards}</section>
        <section class="card">
          <div class="board-head">
            <h2>Today's Dispatch Board</h2>
            <div class="filters">
              <span class="filter active">All</span><span class="filter">Scheduled</span>
              <span class="filter">En Route</span><span class="filter">On Site</span>
            </div>
          </div>
          <ul class="jobs">${jobRows}</ul>
        </section>
      </div>
      <aside class="card quote">
        <h2>Generate Fast Quote</h2>
        <p class="hint">Price from your rate book and text it before you hang up the phone.</p>
        <p class="field-label">Customer Name</p><div class="field">Sarah Mitchell</div>
        <p class="field-label">Mobile Number</p><div class="field">(816) 555-0148</div>
        <p class="field-label">Service Type</p><div class="field">${jobs[1][1]}</div>
        <div class="estimate"><p class="cap">Rate book estimate</p><p class="amt">$180 – $240</p></div>
        <div class="send-btn">Send via SMS</div>
      </aside>
    </main>
  </div>
</div></body></html>`
}
