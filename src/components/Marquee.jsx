import { BUSINESS } from '../config'

const ITEMS = [
  `$${BUSINESS.launchPrice} to launch`,
  `$${BUSINESS.monthlyPrice}/month after`,
  'Same-day edits',
  'Mobile-first design',
  'Local SEO',
  'No contracts',
  ...BUSINESS.serviceAreas,
]

export default function Marquee() {
  return (
    <div className="relative overflow-hidden border-y border-night-700 bg-night-900/60 py-4">
      <div className="flex w-max animate-marquee gap-0 whitespace-nowrap">
        {[0, 1].map((copy) => (
          <div key={copy} aria-hidden={copy === 1} className="flex items-center">
            {ITEMS.map((item) => (
              <span
                key={`${copy}-${item}`}
                className="flex items-center gap-6 px-6 font-display text-sm font-semibold uppercase tracking-[0.2em] text-fog-500"
              >
                {item}
                <span className="text-ember-500">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
