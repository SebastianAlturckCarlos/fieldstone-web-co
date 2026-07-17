import {
  Search,
  Bell,
  Plus,
  TrendingUp,
  TrendingDown,
  CreditCard,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
  UserPlus,
  Send,
  Clock,
  User,
  Building2,
  MoreHorizontal,
} from 'lucide-react'

// ─── Sample data — sized like a real 15-truck operation ──────────────────────

const KPIS = [
  {
    label: 'Revenue MTD',
    value: '$287,400',
    note: '+12.4% vs. last July',
    Icon: TrendingUp,
    noteClass: 'text-emerald-600',
  },
  {
    label: 'Invoice Leakage',
    value: '$46,900',
    note: '23 unpaid · 4 overdue 30+ days',
    Icon: TrendingDown,
    noteClass: 'text-red-600',
  },
  {
    label: 'Avg Ticket',
    value: '$2,140',
    note: '+$180 vs. last quarter',
    Icon: TrendingUp,
    noteClass: 'text-emerald-600',
  },
  {
    label: 'Quote Close Rate',
    value: '62%',
    note: '31 of 50 quotes this month',
    Icon: FileCheck,
    noteClass: 'text-slate-500',
  },
]

// Trailing 12 months: collected revenue vs. unpaid ("leakage"), in $k.
const MONTHS = [
  { m: 'Aug', revenue: 182, leakage: 9 },
  { m: 'Sep', revenue: 176, leakage: 12 },
  { m: 'Oct', revenue: 191, leakage: 8 },
  { m: 'Nov', revenue: 204, leakage: 15 },
  { m: 'Dec', revenue: 187, leakage: 11 },
  { m: 'Jan', revenue: 213, leakage: 14 },
  { m: 'Feb', revenue: 228, leakage: 9 },
  { m: 'Mar', revenue: 246, leakage: 18 },
  { m: 'Apr', revenue: 259, leakage: 12 },
  { m: 'May', revenue: 272, leakage: 21 },
  { m: 'Jun', revenue: 301, leakage: 17 },
  { m: 'Jul', revenue: 287, leakage: 47 },
]
const CHART_MAX = 320

const PIPELINE = [
  {
    stage: 'New Lead',
    count: 4,
    total: '$31.2k',
    deals: [
      { name: 'Westbrook Apartments', job: '12-unit mini-split retrofit', value: '$18,400', meta: 'Referral · 2h ago', org: true },
      { name: 'Riverside Dental', job: 'Duct redesign', value: '$6,200', meta: 'Web form · 5h ago', org: true },
      { name: 'Thompson Residence', job: 'A/C replacement', value: '$5,800', meta: 'Phone · 1d ago' },
    ],
  },
  {
    stage: 'Quote Sent',
    count: 5,
    total: '$38.7k',
    deals: [
      { name: '456 Elm St', job: 'Furnace install', value: '$8,500', meta: 'Sent 1d ago · opened 3×' },
      { name: 'Callahan Bakery', job: 'Rooftop unit replacement', value: '$12,300', meta: 'Sent 2d ago', org: true },
      { name: 'Marlow Auto Group', job: 'Shop heater bank', value: '$9,700', meta: 'Follow-up due today', org: true, warn: true },
    ],
  },
  {
    stage: 'Job Scheduled',
    count: 6,
    total: '$29.4k',
    deals: [
      { name: 'Hilltop Church', job: 'Chiller service', value: '$4,300', meta: 'Crew 2 · Tue 8:00 AM', org: true },
      { name: 'Baxter Warehouse', job: 'Exhaust fan install', value: '$7,150', meta: 'Crew 7 · Wed 7:30 AM', org: true },
      { name: 'Green Residence', job: 'Heat pump swap', value: '$6,900', meta: 'Crew 4 · Thu 9:00 AM' },
    ],
  },
  {
    stage: 'Completed',
    count: 8,
    total: '$41.8k',
    deals: [
      { name: 'Harvest Ln Duplex', job: 'Compressor replacement', value: '$3,450', meta: 'Dave R. · today' },
      { name: "O'Neill Duplex", job: 'Dual condenser install', value: '$8,200', meta: 'Maria G. · yesterday' },
      { name: 'Patel Residence', job: 'Furnace tune-up', value: '$310', meta: 'Sam T. · yesterday' },
    ],
  },
  {
    stage: 'Awaiting Payment',
    count: 23,
    total: '$46.9k',
    deals: [
      { name: 'Hendricks Property Group', job: 'Invoice #1047', value: '$4,120', meta: 'Overdue 31 days', org: true, warn: true },
      { name: 'Lakeside HOA', job: 'Invoice #1052', value: '$5,600', meta: 'Net-30 · due Aug 4', org: true },
      { name: 'Dorsey Residence', job: 'Invoice #1058', value: '$1,240', meta: 'Sent 6 days ago' },
    ],
  },
]

const ACTIVITY = [
  {
    Icon: CreditCard,
    tone: 'bg-emerald-50 text-emerald-600',
    text: 'Payment received from Smith Residence',
    detail: '$2,850 · card on file',
    time: '2m ago',
  },
  {
    Icon: CheckCircle2,
    tone: 'bg-indigo-50 text-indigo-600',
    text: 'Tech #4 (Dave R.) completed job',
    detail: 'Compressor replacement · 2210 Harvest Ln',
    time: '18m ago',
  },
  {
    Icon: FileCheck,
    tone: 'bg-blue-50 text-blue-600',
    text: 'Quote approved by 456 Elm St',
    detail: '$8,500 furnace install · auto-scheduled',
    time: '34m ago',
  },
  {
    Icon: AlertTriangle,
    tone: 'bg-red-50 text-red-600',
    text: 'Invoice #1047 passed 30 days overdue',
    detail: 'Hendricks Property Group · $4,120',
    time: '1h ago',
  },
  {
    Icon: UserPlus,
    tone: 'bg-slate-100 text-slate-600',
    text: 'New lead: Westbrook Apartments',
    detail: 'Referral from Lakeside HOA',
    time: '1h ago',
  },
  {
    Icon: Send,
    tone: 'bg-blue-50 text-blue-600',
    text: 'Quote sent to Callahan Bakery',
    detail: '$12,300 rooftop unit replacement',
    time: '2h ago',
  },
  {
    Icon: CreditCard,
    tone: 'bg-emerald-50 text-emerald-600',
    text: 'Payment received from Nguyen Family',
    detail: '$960 · ACH',
    time: '3h ago',
  },
]

const TABS = ['Dashboard', 'Pipeline', 'Customers', 'Invoicing']

// ─── Pieces ──────────────────────────────────────────────────────────────────

function TopNav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex items-center gap-4 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
            FG
          </div>
          <span className="hidden font-semibold text-slate-900 sm:block">Fieldstone Growth CRM</span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-700">
            Demo · Sample Data
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <div className="relative hidden lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search deals, customers, invoices…"
              className="w-72 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Deal</span>
          </button>
          <button
            type="button"
            title="Notifications"
            className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
            SR
          </div>
        </div>
      </div>

      <nav aria-label="Sections" className="flex gap-1 overflow-x-auto px-4 sm:px-6">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            type="button"
            aria-current={i === 0 ? 'page' : undefined}
            className={`whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors ${
              i === 0
                ? 'border-indigo-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
        <p className="ml-auto hidden items-center pb-2.5 pt-1 text-xs text-slate-400 md:flex">
          Thursday, Jul 17 · 15 trucks · 22 field techs
        </p>
      </nav>
    </header>
  )
}

function KpiStrip() {
  return (
    <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {KPIS.map(({ label, value, note, Icon, noteClass }) => (
        <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${noteClass}`}>
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {note}
          </p>
        </div>
      ))}
    </section>
  )
}

function RevenueChart() {
  return (
    <section
      aria-label="Revenue analytics"
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Revenue & Invoice Leakage</h2>
          <p className="mt-0.5 text-xs text-slate-500">Trailing 12 months · collected vs. unpaid</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" /> Collected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Unpaid
          </span>
        </div>
      </div>

      <div className="relative mt-6 h-44">
        {/* Gridlines */}
        {[
          { pct: 100, label: '$320k' },
          { pct: 50, label: '$160k' },
          { pct: 0, label: '$0' },
        ].map(({ pct, label }) => (
          <div
            key={pct}
            className="absolute inset-x-0 flex items-center gap-2"
            style={{ bottom: `${pct}%` }}
          >
            <span className="w-9 shrink-0 text-right text-[0.6rem] leading-none text-slate-400">
              {label}
            </span>
            <div className="h-px flex-1 border-t border-dashed border-slate-200" />
          </div>
        ))}

        {/* Bars */}
        <div className="absolute inset-y-0 left-11 right-0 flex items-end gap-1.5 sm:gap-2.5">
          {MONTHS.map(({ m, revenue, leakage }) => (
            <div
              key={m}
              className="group flex h-full flex-1 items-end justify-center gap-0.5"
              title={`${m}: $${revenue}k collected · $${leakage}k unpaid`}
            >
              <div
                className="w-full max-w-3 rounded-t-sm bg-indigo-500 transition-colors group-hover:bg-indigo-600"
                style={{ height: `${(revenue / CHART_MAX) * 100}%` }}
              />
              <div
                className="w-full max-w-3 rounded-t-sm bg-amber-400 transition-colors group-hover:bg-amber-500"
                style={{ height: `${(leakage / CHART_MAX) * 100}%` }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="ml-11 mt-2 flex gap-1.5 sm:gap-2.5">
        {MONTHS.map(({ m }) => (
          <span key={m} className="flex-1 text-center text-[0.6rem] text-slate-400">
            {m}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        <p className="text-xs leading-relaxed text-red-700">
          <span className="font-semibold">$46,900 in unpaid invoices this month</span> — 4 accounts
          past 30 days. Auto-reminders are queued for tomorrow, 8:00 AM.
        </p>
      </div>
    </section>
  )
}

function DealCard({ name, job, value, meta, org, warn }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow">
      <div className="flex items-start justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-slate-900">
          {org ? (
            <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          ) : (
            <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          )}
          <span className="truncate">{name}</span>
        </p>
        <button type="button" title="More" className="text-slate-300 hover:text-slate-500">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 truncate text-xs text-slate-500">{job}</p>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">{value}</span>
        <span
          className={`flex items-center gap-1 text-[0.65rem] font-medium ${
            warn ? 'text-red-600' : 'text-slate-400'
          }`}
        >
          <Clock className="h-3 w-3" />
          {meta}
        </span>
      </div>
    </article>
  )
}

function Pipeline() {
  return (
    <section aria-label="Sales pipeline" className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="font-semibold text-slate-900">Sales Pipeline</h2>
        <p className="text-xs text-slate-500">46 open deals · $187,900 in play</p>
      </div>
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-3 p-4">
          {PIPELINE.map(({ stage, count, total, deals }) => (
            <div key={stage} className="w-60 shrink-0 rounded-lg bg-slate-50 p-2.5">
              <div className="flex items-center justify-between px-1 pb-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {stage}
                </p>
                <p className="text-[0.65rem] font-medium text-slate-400">
                  {count} · {total}
                </p>
              </div>
              <div className="space-y-2">
                {deals.map((deal) => (
                  <DealCard key={deal.name} {...deal} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ActivityFeed() {
  return (
    <section
      aria-label="Recent activity"
      className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="font-semibold text-slate-900">Recent Activity</h2>
        <span className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live
        </span>
      </div>
      <ul className="divide-y divide-slate-100">
        {ACTIVITY.map(({ Icon, tone, text, detail, time }) => (
          <li key={text} className="flex items-start gap-3 px-5 py-3">
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tone}`}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug text-slate-800">{text}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{detail}</p>
            </div>
            <span className="shrink-0 text-[0.65rem] text-slate-400">{time}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="border-t border-slate-200 px-5 py-3 text-left text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
      >
        View full audit log →
      </button>
    </section>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Tier2CRMDemo() {
  return (
    <div className="min-h-screen bg-slate-100 font-body text-slate-900 antialiased">
      <TopNav />
      <main className="mx-auto flex max-w-[96rem] flex-col gap-4 p-4 sm:p-6 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <KpiStrip />
          <RevenueChart />
          <Pipeline />
        </div>
        <div className="xl:w-96 xl:shrink-0">
          <ActivityFeed />
        </div>
      </main>
    </div>
  )
}
