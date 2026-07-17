import { Check, ArrowRight, BadgeCheck } from 'lucide-react'
import Reveal from './Reveal'

const COMMITMENT = 'Billed monthly. Requires a 12-month initial commitment to cover custom data architecture.'

const TIERS = [
  {
    name: 'Operations Kickstart',
    audience: 'Teams ready to fix their single biggest bottleneck before it scales with them.',
    price: '$399',
    period: '/ month',
    priceNote: null,
    subline: COMMITMENT,
    features: [
      'Custom single-problem portal — automated quoting, custom dispatch, or your worst headache',
      'Core client dashboard',
      'SMS & email automation',
      'Base analytics & monthly reporting',
      'Ongoing system maintenance & hosting',
      'Unlimited tech support',
    ],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Growth CRM Suite',
    audience: 'Established trade businesses ready to fully digitize their client management.',
    price: '$799',
    period: '/ month',
    priceNote: 'Includes up to 5 user seats',
    subline: COMMITMENT,
    features: [
      'Everything in Operations Kickstart',
      'Full CRM pipeline',
      'Automated job scheduling & dispatch',
      'Complete client & employee portals',
      'Advanced analytics & profitability dashboards',
      'Priority same-day support & ongoing optimization',
    ],
    cta: 'Upgrade to Growth',
    featured: true,
  },
  {
    name: 'Custom Enterprise Architecture',
    audience: 'Multi-fleet regional operations that need end-to-end management, payments, and integrations.',
    price: 'Custom',
    period: 'monthly SLA',
    priceNote: null,
    subline: 'Tailored SLAs and dedicated infrastructure for multi-fleet operations.',
    features: [
      'Everything in Growth CRM Suite',
      'Custom API integrations',
      'White-labeled client portals',
      'Advanced POS routing & secure invoicing',
      'Dedicated technical partner',
      '24/7 operational support',
    ],
    cta: 'Book an Architecture Scoping Call',
    featured: false,
  },
]

function TierCard({ name, audience, price, period, priceNote, subline, features, cta, featured }) {
  return (
    <article
      className={`relative flex h-full flex-col justify-between rounded-3xl border p-8 transition-all duration-300 ${
        featured
          ? 'border-ember-500/40 bg-night-900 shadow-[0_0_60px_rgba(245,147,20,0.1)] md:scale-[1.04]'
          : 'border-night-700 bg-night-900/60 shadow-sm hover:-translate-y-1 hover:border-ember-500/30'
      }`}
    >
      {featured && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-linear-to-r from-ember-400 to-ember-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-night-950">
          Most popular
        </span>
      )}

      <div>
        <h3 className="font-display text-2xl font-semibold text-fog-100">{name}</h3>
        <p className="mt-2.5 text-sm leading-relaxed text-fog-400">{audience}</p>

        <div className="mt-6">
          <div className="flex items-end gap-1.5">
            <span className="font-display text-5xl font-bold tracking-tight text-fog-100">
              {price}
            </span>
            <span className="pb-1.5 text-fog-500">{period}</span>
          </div>
          {priceNote && <p className="mt-2 text-sm font-medium text-fog-300">{priceNote}</p>}
          <p className="mt-2 text-xs leading-relaxed text-fog-500">{subline}</p>
        </div>

        <ul className="mt-8 space-y-3.5 border-t border-night-700 pt-8">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-fog-300">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ember-500/15 ring-1 ring-ember-500/30">
                <Check className="h-3 w-3 text-ember-400" />
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <a
        href="#contact"
        className={`group mt-9 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-center text-sm font-semibold transition-all duration-300 ${
          featured
            ? 'bg-linear-to-r from-ember-400 to-ember-600 text-night-950 hover:scale-[1.02] hover:shadow-lg hover:shadow-ember-500/30'
            : 'border border-night-600 text-fog-100 hover:border-ember-500/60 hover:text-ember-300'
        }`}
      >
        {cta}
        <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
      </a>
    </article>
  )
}

export default function TradePlans() {
  return (
    <section id="plans" className="relative overflow-hidden py-24 sm:py-32">
      <div className="glow right-[-10%] top-[15%] h-110 w-110 bg-ember-600/10" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-ember-400">
            Plans
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight text-fog-100 sm:text-5xl">
            Start at the bottleneck. <span className="text-gradient">Scale to the whole operation.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-fog-400">
            Three ways in — fix your biggest bottleneck, run the whole front office, or architect
            a system that's entirely your own.
          </p>
          <p className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-moss-400/40 bg-moss-500/10 px-5 py-2 text-sm font-semibold text-moss-400">
            <BadgeCheck className="h-4 w-4 shrink-0" />
            Zero Setup Fees. Full Implementation & Onboarding Included.
          </p>
        </Reveal>

        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3 md:gap-5 lg:gap-7">
          {TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 0.1} className="h-full">
              <TierCard {...tier} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
