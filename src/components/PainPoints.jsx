import { FileWarning, Route, Unplug } from 'lucide-react'
import Reveal from './Reveal'

const PAINS = [
  {
    Icon: FileWarning,
    title: 'Quotes that leak revenue',
    body: 'Estimates built in text threads, spreadsheets, and one estimator’s memory don’t get followed up — they get forgotten. Every unsent follow-up and unpriced change order is margin you already earned, walking out the door.',
    consequence: 'Lost revenue you never see on a report',
  },
  {
    Icon: Route,
    title: 'Dispatch by whiteboard',
    body: 'A whiteboard can’t see traffic, skill sets, or job value. Techs crisscross the metro, emergency calls jump the queue by whoever shouts loudest, and your highest-billing crews burn hours on windshield time.',
    consequence: 'Fewer completed jobs per truck, per day',
  },
  {
    Icon: Unplug,
    title: 'A POS that talks to no one',
    body: 'Payments in one app, customers in another, job costs in a third. Reconciliation eats your office manager’s week, and nobody can answer the only question that matters: what did we actually make on that job?',
    consequence: 'Zero real-time visibility into profitability',
  },
]

export default function PainPoints() {
  return (
    <section id="why" className="relative overflow-hidden py-24 sm:py-32">
      <div className="glow right-[-10%] top-[10%] h-100 w-100 bg-ember-600/10" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-ember-400">
            Why growth stalls
          </p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight text-fog-100 sm:text-5xl">
            Growth doesn't stall in the field. <span className="text-gradient">It stalls in the office.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-fog-400">
            Past ten trucks, the cracks aren't in your workmanship — they're in the handoffs
            between quoting, dispatch, and payment. Three failure points show up in almost every
            operation we audit.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {PAINS.map(({ Icon, title, body, consequence }, i) => (
            <Reveal key={title} delay={i * 0.1} className="h-full">
              <article className="flex h-full flex-col rounded-2xl border border-night-700 bg-night-900/60 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-ember-500/50 hover:shadow-[0_10px_40px_rgba(245,147,20,0.08)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-ember-400/15 to-ember-600/10 text-ember-400 ring-1 ring-ember-500/20">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-fog-100">{title}</h3>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-fog-400">{body}</p>
                <p className="mt-6 border-t border-night-700 pt-4 text-xs font-semibold uppercase tracking-wider text-ember-400/90">
                  The cost — {consequence}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
