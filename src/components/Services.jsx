import { Palette, Smartphone, Zap, MapPin, CalendarCheck, ShieldCheck } from 'lucide-react'
import Reveal from './Reveal'

const SERVICES = [
  {
    Icon: Palette,
    title: 'Custom design',
    body: 'No cookie-cutter templates. A site designed around your business, your colors, your story.',
  },
  {
    Icon: Smartphone,
    title: 'Mobile-first',
    body: 'Most of your customers find you on their phone. Your site will look flawless there first.',
  },
  {
    Icon: Zap,
    title: 'Same-day edits',
    body: 'New hours? New menu? New photos? Text us the change and we fix it then and there.',
  },
  {
    Icon: MapPin,
    title: 'Local SEO',
    body: 'Show up when people nearby search for what you do — Google, Maps, and beyond.',
  },
  {
    Icon: CalendarCheck,
    title: 'Booking & forms',
    body: 'Let customers request quotes, book appointments, or reach you straight from the site.',
  },
  {
    Icon: ShieldCheck,
    title: 'Hosting & care',
    body: 'Fast, secure hosting with updates and backups handled. You never touch the tech.',
  },
]

export default function Services() {
  return (
    <section id="services" className="relative overflow-hidden py-24 sm:py-32">
      <div className="glow right-[-10%] top-[10%] h-100 w-100 bg-ember-600/10" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-ember-400">
            What we do
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight text-fog-100 sm:text-5xl">
            Everything your business needs <span className="text-gradient">online.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 0.07}>
              <div className="group h-full rounded-2xl border border-night-700 bg-night-900/60 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-ember-500/50 hover:shadow-[0_10px_40px_rgba(245,147,20,0.08)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-ember-400/15 to-ember-600/10 text-ember-400 ring-1 ring-ember-500/20 transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-fog-100">{title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-fog-400">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
