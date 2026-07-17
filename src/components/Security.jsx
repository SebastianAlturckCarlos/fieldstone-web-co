import { Lock, Server, Activity, EyeOff, ShieldCheck } from 'lucide-react'
import Reveal from './Reveal'

const PILLARS = [
  {
    Icon: Lock,
    title: 'Bank-level encryption',
    body: 'Every POS transaction is encrypted end to end — in transit and at rest — over PCI-aligned payment rails. Cardholder data never touches a spreadsheet or an office hard drive.',
  },
  {
    Icon: Server,
    title: 'Secure data architecture',
    body: 'Your system runs in its own isolated environment with role-based access and encrypted, versioned backups. Techs see their jobs. Owners see everything. Nobody sees more than their role allows.',
  },
  {
    Icon: Activity,
    title: '99.9% uptime SLA',
    body: 'Redundant infrastructure monitored around the clock, with the uptime guarantee written into your service agreement — not a marketing page. Your dispatch board stays on.',
  },
  {
    Icon: EyeOff,
    title: 'Strict data privacy',
    body: 'Your customer list, pricing, and job history are yours — and your clients’ information stays theirs. Never sold, never shared, never mined. That’s contractual, not a promise.',
  },
]

const CHIPS = ['PCI-aligned payments', 'Encrypted at rest & in transit', 'Role-based access', 'SLA-backed uptime']

export default function Security() {
  return (
    <section id="security" className="relative overflow-hidden py-24 sm:py-32">
      <div className="glow left-[-10%] bottom-[-10%] h-110 w-110 bg-ember-500/10" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-ember-500/25 bg-night-900 shadow-[0_0_60px_rgba(245,147,20,0.08)]">
            <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
              <div>
                <p className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.3em] text-ember-400">
                  <ShieldCheck className="h-4 w-4" />
                  Security & data integrity
                </p>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-fog-100 sm:text-4xl">
                  Your operation runs on this data. <span className="text-gradient">We protect it like it.</span>
                </h2>
                <p className="mt-4 leading-relaxed text-fog-400">
                  When one system holds your customers, your payments, and your schedule, security
                  isn't a feature — it's the foundation. Every Fieldstone deployment ships hardened
                  by default, for your business and for every client whose data you hold.
                </p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {CHIPS.map((chip) => (
                    <li
                      key={chip}
                      className="rounded-full border border-night-600 bg-night-950/60 px-3.5 py-1.5 text-xs font-medium text-fog-300"
                    >
                      {chip}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {PILLARS.map(({ Icon, title, body }) => (
                  <article
                    key={title}
                    className="rounded-2xl border border-night-700 bg-night-950/60 p-6"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-ember-400/15 to-ember-600/10 text-ember-400 ring-1 ring-ember-500/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-base font-semibold text-fog-100">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-fog-400">{body}</p>
                  </article>
                ))}
              </div>
            </div>

            <p className="border-t border-night-700 bg-night-950/40 px-8 py-4 text-center text-xs uppercase tracking-wider text-fog-500">
              Uptime, encryption, and privacy terms are written into every service agreement
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
