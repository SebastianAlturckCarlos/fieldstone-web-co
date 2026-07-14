import { Mail } from 'lucide-react'
import Logo from './Logo'
import SocialIcons from './SocialIcons'
import { BUSINESS } from '../config'

const LINKS = [
  { label: 'Services', href: '#services' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'How it works', href: '#process' },
  { label: 'About', href: '#about' },
  { label: 'Get a quote', href: '#quote' },
]

export default function Footer() {
  return (
    <footer className="border-t border-night-700 bg-night-950">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <a href="#top" aria-label={BUSINESS.name}>
              <Logo />
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-fog-500">
              {BUSINESS.tagline} ${BUSINESS.launchPrice} to launch, ${BUSINESS.monthlyPrice}/month
              after — with edits fixed the same day you ask.
            </p>
            <SocialIcons className="mt-6" />
          </div>

          <div>
            <p className="font-display font-semibold uppercase tracking-wider text-fog-100">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-fog-400 transition-colors hover:text-ember-400">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-display font-semibold uppercase tracking-wider text-fog-100">
              Contact
            </p>
            <a
              href={`mailto:${BUSINESS.quoteEmail}`}
              className="mt-4 flex items-center gap-2.5 text-sm text-fog-400 transition-colors hover:text-ember-400"
            >
              <Mail className="h-4 w-4 text-ember-400" />
              {BUSINESS.quoteEmail}
            </a>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-fog-500">
              Proudly serving
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-fog-400">
              {BUSINESS.serviceAreas.join(' · ')} — and anywhere local business needs a hand.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-night-700 pt-6 text-xs text-fog-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.
          </p>
          <p>Built stone by stone. 🪨</p>
        </div>
      </div>
    </footer>
  )
}
