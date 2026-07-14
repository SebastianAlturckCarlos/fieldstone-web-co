import { MessageSquareText, Hammer, Rocket } from 'lucide-react'
import Reveal from './Reveal'

const STEPS = [
  {
    Icon: MessageSquareText,
    step: '01',
    title: 'Tell us your story',
    body: 'A quick 15-minute chat about your business — what you do, who you serve, what you want people to see.',
  },
  {
    Icon: Hammer,
    step: '02',
    title: 'We lay the stones',
    body: 'We design and build your site in days. You review it, we polish it until you love it.',
  },
  {
    Icon: Rocket,
    step: '03',
    title: 'Launch & relax',
    body: 'Your site goes live and we handle everything after. Need a change? Text us — fixed the same day.',
  },
]

export default function Process() {
  return (
    <section id="process" className="relative border-y border-night-700 bg-night-900/40 py-24 sm:py-32">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-ember-400">
            How it works
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight text-fog-100 sm:text-5xl">
            From first chat to live site, <span className="text-gradient">in days.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {STEPS.map(({ Icon, step, title, body }, i) => (
            <Reveal key={step} delay={i * 0.12}>
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-ember-400/15 to-ember-600/10 text-ember-400 ring-1 ring-ember-500/25">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-display text-6xl font-bold text-night-700">{step}</span>
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold text-fog-100">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-fog-400">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
