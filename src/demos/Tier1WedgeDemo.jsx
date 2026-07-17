import {
  LayoutDashboard,
  ClipboardList,
  Truck,
  Users,
  Settings,
  Search,
  Bell,
  MapPin,
  Clock,
  User,
  Zap,
  Send,
  AlertTriangle,
  CheckCircle2,
  Plus,
} from 'lucide-react'

// ─── Sample data (static mock — no state, no network) ────────────────────────

const METRICS = [
  {
    Icon: Truck,
    label: 'Active Jobs Today',
    value: '14',
    note: '+3 vs. yesterday',
    noteClass: 'text-emerald-600',
  },
  {
    Icon: ClipboardList,
    label: 'Pending Quotes',
    value: '7',
    note: '2 expiring within 48h',
    noteClass: 'text-amber-600',
  },
  {
    Icon: Users,
    label: 'Unassigned Technicians',
    value: '3',
    note: 'Assign from the board below',
    noteClass: 'text-blue-600',
  },
]

const JOBS = [
  {
    time: '7:00 AM',
    title: 'Seasonal Maintenance',
    address: '33 Landon Pl',
    tech: 'John D.',
    status: 'Completed',
  },
  {
    time: '8:00 AM',
    title: 'A/C Repair',
    address: '123 Main St',
    tech: 'John D.',
    status: 'On Site',
  },
  {
    time: '9:30 AM',
    title: 'Furnace Tune-Up',
    address: '448 Oakwood Dr',
    tech: 'Maria G.',
    status: 'En Route',
  },
  {
    time: '10:15 AM',
    title: 'Compressor Replacement',
    address: '2210 Harvest Ln',
    tech: 'Dave R.',
    status: 'Scheduled',
  },
  {
    time: '11:00 AM',
    title: 'Thermostat Install',
    address: '87 Birchwood Ct',
    tech: null,
    status: 'Unassigned',
  },
  {
    time: '1:30 PM',
    title: 'Duct Cleaning',
    address: '1509 Prairie View Rd',
    tech: 'Sam T.',
    status: 'Scheduled',
  },
  {
    time: '3:00 PM',
    title: 'No Cooling — Emergency',
    address: '764 Elmhurst Ave',
    tech: null,
    status: 'Emergency',
  },
]

const STATUS_STYLES = {
  Completed: 'bg-slate-100 text-slate-500 ring-slate-400/30',
  'On Site': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'En Route': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Scheduled: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  Unassigned: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Emergency: 'bg-red-50 text-red-700 ring-red-600/20',
}

const SERVICE_TYPES = [
  'A/C Repair',
  'Furnace Repair',
  'New System Install',
  'Thermostat Install',
  'Duct Cleaning',
  'Maintenance Plan',
]

const FILTERS = ['All', 'Scheduled', 'En Route', 'On Site', 'Completed']

// ─── Pieces ──────────────────────────────────────────────────────────────────

function Sidebar() {
  const items = [
    { Icon: LayoutDashboard, label: 'Dashboard', active: true },
    { Icon: ClipboardList, label: 'Quotes', active: false },
    { Icon: Truck, label: 'Dispatch', active: false },
    { Icon: Users, label: 'Customers', active: false },
  ]
  return (
    <nav
      aria-label="Primary"
      className="hidden w-16 shrink-0 flex-col items-center gap-2 bg-slate-900 py-4 md:flex"
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
        FW
      </div>
      {items.map(({ Icon, label, active }) => (
        <button
          key={label}
          type="button"
          title={label}
          aria-current={active ? 'page' : undefined}
          className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
            active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Icon className="h-5 w-5" />
        </button>
      ))}
      <button
        type="button"
        title="Settings"
        className="mt-auto flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
      >
        <Settings className="h-5 w-5" />
      </button>
    </nav>
  )
}

function Header() {
  return (
    <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white md:hidden">
        FW
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="truncate font-semibold text-slate-900">Fieldstone Wedge</h1>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-700">
            Demo · Sample Data
          </span>
        </div>
        <p className="text-xs text-slate-500">Dispatch Overview — Thursday, Jul 17</p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search jobs, customers…"
            className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          type="button"
          title="Notifications"
          className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
          SR
        </div>
      </div>
    </header>
  )
}

function MetricCards() {
  return (
    <section aria-label="Today's metrics" className="grid gap-4 sm:grid-cols-3">
      {METRICS.map(({ Icon, label, value, note, noteClass }) => (
        <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Icon className="h-4.5 w-4.5" />
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className={`mt-1 text-xs font-medium ${noteClass}`}>{note}</p>
        </div>
      ))}
    </section>
  )
}

function JobRow({ time, title, address, tech, status }) {
  const done = status === 'Completed'
  return (
    <li className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
      <span className="flex w-20 shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-500">
        <Clock className="h-3.5 w-3.5 text-slate-400" />
        {time}
      </span>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${done ? 'text-slate-400' : 'text-slate-900'}`}>
          {status === 'Emergency' && (
            <AlertTriangle className="mr-1.5 inline h-4 w-4 -translate-y-px text-red-500" />
          )}
          {title}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
          {address}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {tech ? (
          <span className="flex items-center gap-1.5 text-sm text-slate-600">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
              <User className="h-3.5 w-3.5 text-slate-500" />
            </span>
            {tech}
          </span>
        ) : (
          <button
            type="button"
            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
          >
            Assign Tech
          </button>
        )}
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${STATUS_STYLES[status]}`}
        >
          {done && <CheckCircle2 className="h-3 w-3" />}
          {status}
        </span>
      </div>
    </li>
  )
}

function DispatchBoard() {
  return (
    <section
      aria-label="Dispatch board"
      className="rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Truck className="h-4.5 w-4.5 text-blue-600" />
          Today's Dispatch Board
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f, i) => (
            <button
              key={f}
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                i === 0
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <ul className="divide-y divide-slate-100">
        {JOBS.map((job) => (
          <JobRow key={`${job.time}-${job.address}`} {...job} />
        ))}
      </ul>
      <div className="border-t border-slate-200 px-5 py-3">
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add job
        </button>
      </div>
    </section>
  )
}

function QuickQuote() {
  const field =
    'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:w-80 xl:shrink-0">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Zap className="h-4 w-4" />
        </span>
        Generate Fast Quote
      </h2>
      <p className="mt-1.5 text-xs text-slate-500">
        Price from your rate book and text it before you hang up the phone.
      </p>

      <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Customer Name
          </span>
          <input type="text" placeholder="e.g. Sarah Mitchell" className={field} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Mobile Number
          </span>
          <input type="tel" placeholder="(816) 555-0148" className={field} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Service Type
          </span>
          <select className={field} defaultValue={SERVICE_TYPES[0]}>
            {SERVICE_TYPES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3.5 py-3">
          <p className="text-xs font-medium text-blue-700">Rate book estimate</p>
          <p className="mt-0.5 text-lg font-bold text-blue-900">$180 – $240</p>
          <p className="text-[0.65rem] text-blue-600">Parts & diagnostic included · editable before send</p>
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Send className="h-4 w-4" />
          Send via SMS
        </button>
        <p className="text-center text-[0.65rem] text-slate-400">
          Every quote logs to the customer record automatically.
        </p>
      </form>
    </aside>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Tier1WedgeDemo() {
  return (
    <div className="flex min-h-screen bg-slate-100 font-body text-slate-900 antialiased">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 xl:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <MetricCards />
            <DispatchBoard />
          </div>
          <QuickQuote />
        </main>
      </div>
    </div>
  )
}
