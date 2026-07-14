import { Check, ArrowRight } from 'lucide-react'
import Reveal from './Reveal'
import { BUSINESS } from '../config'

const INCLUDED = [
  'Custom-designed website, built for you',
  'Live in days — not weeks or months',
  'Hosting, security & backups handled',
  'Unlimited edits — fixed same day',
  'Mobile-friendly & lightning fast',
  'No contracts. Cancel anytime.',
]

export default function Pricing() {
  return (
    <section id="pricing" className="relative overflow-hidden py-24 sm:py-32">
      <div className="glow left-[-10%] top-[20%] h-110 w-110 bg-ember-500/12" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-ember-400">
            Pricing
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight text-fog-100 sm:text-5xl">
            One price. <span className="text-gradient">No surprises.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-fog-400">
            Agencies charge thousands and take months. We keep it simple so any local business can
            afford a great website.
          </p>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <div className="relative h-full overflow-hidden rounded-3xl border border-ember-500/40 bg-night-900 p-8 shadow-[0_0_60px_rgba(245,147,20,0.1)] sm:p-10">
              <div className="glow -right-20 -top-20 h-60 w-60 bg-ember-500/20" />
              <span className="relative inline-block rounded-full bg-ember-500/15 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-ember-300 ring-1 ring-ember-500/30">
                The Fieldstone deal
              </span>

              <div className="relative mt-6 flex flex-wrap items-end gap-x-6 gap-y-2">
                <div>
                  <div className="flex items-start">
                    <span className="mt-2 font-display text-2xl font-semibold text-fog-300">$</span>
                    <span className="font-display text-7xl font-bold tracking-tight text-fog-100">
                      {BUSINESS.launchPrice}
                    </span>
                  </div>
                  <p className="text-sm text-fog-500">one-time, to launch</p>
                </div>
                <div className="pb-1">
                  <div className="flex items-start">
                    <span className="mt-1 font-display text-lg font-semibold text-fog-300">+ $</span>
                    <span className="font-display text-4xl font-bold tracking-tight text-fog-100">
                      {BUSINESS.monthlyPrice}
                    </span>
                    <span className="self-end pb-1 text-fog-500">/mo</span>
                  </div>
                  <p className="text-sm text-fog-500">hosting + unlimited edits</p>
                </div>
              </div>

              <ul className="relative mt-8 space-y-3.5">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-fog-300">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ember-500/15 ring-1 ring-ember-500/30">
                      <Check className="h-3 w-3 text-ember-400" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href="#quote"
                className="group relative mt-9 flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-ember-400 to-ember-600 px-7 py-4 font-semibold text-night-950 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-ember-500/30"
              >
                Claim your spot
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="rounded-3xl border border-night-700 bg-night-900/50 p-8">
                <p className="font-display text-sm font-semibold uppercase tracking-wider text-fog-500">
                  Typical agency
                </p>
                <p className="mt-3 font-display text-4xl font-bold text-fog-400 line-through decoration-ember-500/70 decoration-2">
                  $2,000+
                </p>
                <p className="mt-2 text-sm leading-relaxed text-fog-500">
                  Weeks of waiting, change fees for every tweak, and a stranger answering the phone.
                </p>
              </div>
              <div className="rounded-3xl border border-night-700 bg-night-900/50 p-8">
                <p className="font-display text-sm font-semibold uppercase tracking-wider text-fog-500">
                  Why so cheap?
                </p>
                <p className="mt-3 text-sm leading-relaxed text-fog-400">
                  No office, no sales team, no bloat. Just great websites for neighbors who need
                  them — and long-term relationships over one-time paydays.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
