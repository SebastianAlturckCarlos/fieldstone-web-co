import {
  Truck,
  MapPin,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  Wifi,
  Clock,
  Building2,
  ArrowLeftRight,
  Radio,
  Signal,
  BatteryFull,
  ShieldCheck,
  User,
} from 'lucide-react'

// ─── Sample data — one live job flowing between field and office ─────────────

// Trucks positioned on the fleet-map placeholder (percent offsets).
const FLEET = [
  { id: 'T-02', top: '22%', left: '14%' },
  { id: 'T-04', top: '58%', left: '26%' },
  { id: 'T-07', top: '30%', left: '55%' },
  { id: 'T-09', top: '72%', left: '64%' },
  { id: 'T-11', top: '44%', left: '78%', active: true }, // on-site at 789 Oak Ave
]

const TRANSACTIONS = [
  {
    time: '2:41 PM',
    label: 'Payment received — Simmons Residence',
    detail: 'Invoice #2379 · card on file',
    amount: '$640.00',
    status: 'Paid',
    tone: 'paid',
  },
  {
    time: '2:36 PM',
    label: 'Invoice synced from Truck 07',
    detail: 'Invoice #2381 · Callahan Bakery',
    amount: '$1,980.00',
    status: 'Synced',
    tone: 'synced',
  },
  {
    time: '2:28 PM',
    label: 'Awaiting Payment — 789 Oak Ave',
    detail: 'POS session live on Truck 11 · Marcus D.',
    amount: '$1,250.00',
    status: 'Awaiting Payment',
    tone: 'awaiting',
    live: true,
  },
  {
    time: '2:12 PM',
    label: 'Quote approved — Ferndale Office Park',
    detail: 'Quote #Q-118 · rooftop unit bank',
    amount: '$6,400.00',
    status: 'Approved',
    tone: 'synced',
  },
  {
    time: '1:58 PM',
    label: 'Payment received — Kowalski Residence',
    detail: 'Invoice #2377 · tap to pay',
    amount: '$310.00',
    status: 'Paid',
    tone: 'paid',
  },
]

const STATUS_TONES = {
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  synced: 'bg-slate-100 text-slate-600 border-slate-200',
  awaiting: 'bg-amber-50 text-amber-700 border-amber-300',
}

// Line items sum exactly to the $1,250.00 total on the tablet.
const PARTS = [
  { name: 'Condenser fan motor (OEM)', price: '$285.00' },
  { name: 'Dual-run capacitor 45/5 µF', price: '$38.00' },
  { name: 'Refrigerant recharge — R-410A, 2 lbs', price: '$122.00' },
]

// ─── Office panel (left) ─────────────────────────────────────────────────────

function FleetMap() {
  return (
    <div
      className="relative h-52 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:h-60"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgb(226 232 240 / 0.7) 1px, transparent 1px), linear-gradient(to bottom, rgb(226 232 240 / 0.7) 1px, transparent 1px)',
        backgroundSize: '2.5rem 2.5rem',
      }}
    >
      {/* Stylized "roads" */}
      <div className="absolute left-0 top-[38%] h-1.5 w-full bg-slate-200/80" />
      <div className="absolute left-[42%] top-0 h-full w-1.5 bg-slate-200/80" />

      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500 shadow-sm ring-1 ring-slate-200">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Live Fleet Map
      </div>
      <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[0.65rem] font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
        5 trucks on jobs · 2 en route
      </div>

      {FLEET.map((t) => (
        <div
          key={t.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ top: t.top, left: t.left }}
        >
          <div
            className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[0.6rem] font-bold shadow-sm ring-1 ${
              t.active
                ? 'bg-emerald-600 text-white ring-emerald-700'
                : 'bg-white text-slate-600 ring-slate-300'
            }`}
          >
            <Truck className="h-3 w-3" />
            {t.id}
          </div>
        </div>
      ))}

      {/* The job both panels share */}
      <div className="absolute left-[78%] top-[44%] -translate-x-1/2 translate-y-2">
        <div className="mt-3 flex items-center gap-1 whitespace-nowrap rounded-md bg-amber-100 px-1.5 py-1 text-[0.6rem] font-semibold text-amber-800 ring-1 ring-amber-300">
          <MapPin className="h-3 w-3" />
          789 Oak Ave
        </div>
      </div>
    </div>
  )
}

function TransactionLog() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Radio className="h-4 w-4 text-emerald-600" />
          Incoming transactions
        </h3>
        <span className="text-[0.65rem] font-medium uppercase tracking-wider text-slate-400">
          Auto-synced from field POS
        </span>
      </div>

      <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {TRANSACTIONS.map((tx) => (
          <li
            key={tx.label}
            className={`flex items-center gap-3 px-4 py-3 ${
              tx.live ? 'bg-amber-50/70' : ''
            }`}
          >
            <span className="w-14 shrink-0 text-[0.7rem] tabular-nums text-slate-400">
              {tx.time}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm ${
                  tx.live ? 'font-semibold text-amber-900' : 'font-medium text-slate-700'
                }`}
              >
                {tx.label}
              </p>
              <p className="truncate text-xs text-slate-400">{tx.detail}</p>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-800">
              {tx.amount}
            </span>
            <span
              className={`hidden shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold sm:inline-flex ${STATUS_TONES[tx.tone]}`}
            >
              {tx.live && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                </span>
              )}
              {tx.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function OfficePanel() {
  return (
    <section aria-label="Office admin dashboard">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-slate-500">
        Office · Admin Dashboard
      </p>

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Desktop-app window chrome */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="ml-3 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Building2 className="h-3.5 w-3.5" />
            Fieldstone Enterprise — Operations HQ
          </span>
          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">
            Live
          </span>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          {/* Compact day-at-a-glance strip */}
          <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50 text-center">
            {[
              ['Collected today', '$14,280'],
              ['Open invoices', '3'],
              ['Trucks active', '5 / 9'],
            ].map(([label, value]) => (
              <div key={label} className="px-2 py-2.5">
                <p className="text-base font-bold tabular-nums text-slate-800">{value}</p>
                <p className="text-[0.65rem] font-medium uppercase tracking-wider text-slate-400">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <FleetMap />
          <TransactionLog />
        </div>
      </div>
    </section>
  )
}

// ─── Technician tablet panel (right) ─────────────────────────────────────────

function TabletStatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-3 text-slate-400">
      <span className="text-xs font-semibold tabular-nums text-slate-500">2:47 PM</span>
      <div className="flex items-center gap-1.5">
        <Signal className="h-3.5 w-3.5" />
        <Wifi className="h-3.5 w-3.5" />
        <BatteryFull className="h-4 w-4" />
      </div>
    </div>
  )
}

function LineItems() {
  return (
    <div className="rounded-xl border border-slate-200">
      <p className="border-b border-slate-100 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">
        Parts
      </p>
      <ul className="divide-y divide-slate-100">
        {PARTS.map((p) => (
          <li key={p.name} className="flex items-baseline justify-between gap-3 px-4 py-2">
            <span className="text-sm text-slate-600">{p.name}</span>
            <span className="shrink-0 text-sm font-medium tabular-nums text-slate-800">
              {p.price}
            </span>
          </li>
        ))}
      </ul>
      <p className="border-y border-slate-100 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">
        Labor
      </p>
      <div className="flex items-baseline justify-between gap-3 px-4 py-2">
        <span className="text-sm text-slate-600">On-site labor — 3.5 hrs × $205</span>
        <span className="shrink-0 text-sm font-medium tabular-nums text-slate-800">$717.50</span>
      </div>
      <div className="space-y-1 border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal</span>
          <span className="tabular-nums">$1,162.50</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Sales tax</span>
          <span className="tabular-nums">$87.50</span>
        </div>
      </div>
    </div>
  )
}

function TechnicianPanel() {
  return (
    <section aria-label="Technician tablet point of sale" className="flex flex-col">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-slate-500 md:text-right">
        Field · Technician POS — Truck 11
      </p>

      {/* Device frame */}
      <div className="mx-auto mt-3 w-full max-w-sm rounded-3xl border-4 border-gray-800 bg-gray-900 p-4 shadow-2xl shadow-slate-900/25">
        <div className="overflow-hidden rounded-2xl bg-white">
          <TabletStatusBar />

          {/* App header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 pb-3 pt-2">
            <div>
              <p className="text-sm font-bold text-slate-900">Fieldstone POS</p>
              <p className="text-xs text-slate-400">Invoice #2384</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              <User className="h-3.5 w-3.5" />
              Marcus D.
            </span>
          </div>

          <div className="space-y-4 px-5 py-4">
            {/* Job context — mirrors the highlighted row in the office log */}
            <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-slate-800">789 Oak Ave</p>
                <p className="text-xs text-slate-500">
                  Condenser fan motor replacement · Delgado Residence
                </p>
              </div>
            </div>

            <LineItems />

            {/* Big, glanceable total — the tech's primary read */}
            <div className="text-center">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-slate-400">
                Total due
              </p>
              <p className="mt-1 text-5xl font-bold tabular-nums tracking-tight text-slate-900">
                $1,250.00
              </p>
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-600/25 transition-colors hover:bg-emerald-700"
            >
              <Wifi className="h-5 w-5 rotate-90" />
              Tap to Pay
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <CreditCard className="h-4 w-4" />
              Process Credit Card
            </button>

            {/* The proof of integration */}
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <RefreshCw className="h-4 w-4 animate-spin [animation-duration:2.5s]" />
                Syncing to Office…
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Live on HQ log
              </span>
            </div>

            <p className="flex items-center justify-center gap-1.5 pb-1 text-[0.65rem] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              End-to-end encrypted · PCI-aligned payment routing
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Tier3EnterpriseDemo() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Demo banner */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 sm:px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            FE
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 sm:text-base">
              Fieldstone Custom Enterprise — Field ↔ Office Sync
            </h1>
            <p className="text-xs text-slate-500">
              One transaction, two screens: the technician's tablet and the office log, in real time.
            </p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            <Clock className="h-3.5 w-3.5" />
            Demo · Sample Data
          </span>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-7xl items-start gap-10 px-4 py-8 sm:px-6 md:grid-cols-2 md:gap-14 md:py-12">
        <OfficePanel />
        <TechnicianPanel />

        {/* Sync connector between the two worlds (desktop only) */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
          <span className="flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3.5 py-1.5 text-xs font-bold text-emerald-700 shadow-md">
            <ArrowLeftRight className="h-4 w-4" />
            Two-way sync · &lt;1s
          </span>
        </div>
      </main>
    </div>
  )
}
