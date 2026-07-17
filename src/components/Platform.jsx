import {
  PhoneIncoming,
  FileCheck,
  CalendarClock,
  Wrench,
  Receipt,
  Users,
  Database,
  CreditCard,
  Lock,
  ArrowLeftRight,
} from 'lucide-react'
import Reveal from './Reveal'

const WORKFLOW = [
  { Icon: PhoneIncoming, step: '01', title: 'Lead intake', detail: 'Every call & form captured' },
  { Icon: FileCheck, step: '02', title: 'Quote & approval', detail: 'Priced, sent, tracked' },
  { Icon: CalendarClock, step: '03', title: 'Dispatch & routing', detail: 'Right crew, right route' },
  { Icon: Wrench, step: '04', title: 'Job execution', detail: 'Field docs & checklists' },
  { Icon: Receipt, step: '05', title: 'Invoice & payment', detail: 'Posted to the same ledger' },
]

const MODULES = [
  {
    Icon: Users,
    name: 'Client & Employee Portals',
    body: 'Customers approve quotes, track jobs, and pay online without calling your office. Techs get routes, job history, and checklists in the field.',
    capabilities: ['Online quote approvals', 'Live job tracking', 'Field-ready tech views'],
  },
  {
    Icon: Database,
    name: 'CRM Core',
    body: 'One record for every customer, quote, job, and follow-up. Full pipeline visibility from first call to repeat service agreement — nothing lives in anyone’s head.',
    capabilities: ['Unified customer records', 'Automated follow-ups', 'Job scheduling & dispatch'],
  },
  {
    Icon: CreditCard,
    name: 'POS & Payments',
    body: 'Card-present in the field or invoiced from the office — every dollar posts against the job it came from, over encrypted, PCI-aligned payment rails.',
    capabilities: ['Secure payment routing', 'Job-level profitability', 'Same-day reconciliation'],
  },
]

export default function Platform() {
  return (
    <section id="platform" className="relative overflow-hidden border-y border-night-700 bg-night-900/40 py-24 sm:py-32">
      <div className="glow left-[-10%] top-[20%] h-110 w-110 bg-ember-500/12" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-ember-400">
            The platform
          </p>
          <h2 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight text-fog-100 sm:text-5xl">
            One connected system, <span className="text-gradient">from first call to cleared payment.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-fog-400">
            We don't sell seats in someone else's software. We architect portals, a CRM, and a POS
            around the way your operation already runs — then wire them together so data is entered
            once and flows everywhere.
          </p>
        </Reveal>

        {/* Workflow rail: lead → payment */}
        <Reveal delay={0.1}>
          <ol className="relative mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-5 md:gap-4">
            <div
              aria-hidden
              className="absolute left-[10%] right-[10%] top-6 hidden h-px bg-linear-to-r from-ember-500/10 via-ember-500/40 to-ember-500/10 md:block"
            />
            {WORKFLOW.map(({ Icon, step, title, detail }) => (
              <li key={step} className="relative flex flex-col items-start md:items-center md:text-center">
                <div className="z-10 flex h-12 w-12 items-center justify-center rounded-xl border border-ember-500/25 bg-night-950 text-ember-400">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 font-display text-xs font-bold tracking-widest text-fog-500">{step}</p>
                <h3 className="mt-1 font-display text-sm font-semibold text-fog-100">{title}</h3>
                <p className="mt-1 text-xs text-fog-500">{detail}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        {/* The three modules, wired together */}
        <div className="relative mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[1, 2].map((n) => (
            <div
              key={n}
              aria-hidden
              className="absolute top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-night-600 bg-night-950 px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-fog-400 shadow-lg md:flex"
              style={{ left: `${(n * 100) / 3}%` }}
            >
              <Lock className="h-3 w-3 text-ember-400" />
              <ArrowLeftRight className="h-3 w-3 text-ember-400" />
            </div>
          ))}

          {MODULES.map(({ Icon, name, body, capabilities }, i) => (
            <Reveal key={name} delay={i * 0.1} className="h-full">
              <article className="flex h-full flex-col rounded-2xl border border-night-700 bg-night-900/80 p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-ember-400/15 to-ember-600/10 text-ember-400 ring-1 ring-ember-500/20">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-fog-100">{name}</h3>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-fog-400">{body}</p>
                <ul className="mt-5 space-y-2 border-t border-night-700 pt-5">
                  {capabilities.map((cap) => (
                    <li key={cap} className="flex items-center gap-2.5 text-xs font-medium text-fog-300">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-ember-400" />
                      {cap}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Shared data layer underneath the stack */}
        <Reveal delay={0.2}>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 rounded-2xl border border-ember-500/25 bg-night-900 px-6 py-5 text-center sm:flex-row">
            <Lock className="h-4 w-4 shrink-0 text-ember-400" />
            <p className="text-sm text-fog-300">
              <span className="font-semibold text-fog-100">One encrypted data layer underneath.</span>{' '}
              Every module reads and writes the same record — no exports, no re-keying, no version
              of the truth per app.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
