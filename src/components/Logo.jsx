// Brand mark: three stacked fieldstones forming an abstract "F".
export function LogoMark({ className = 'h-10 w-10' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="stoneGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd48a" />
          <stop offset="55%" stopColor="#fbb03f" />
          <stop offset="100%" stopColor="#f59314" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="#1b1917" stroke="#3a3630" strokeWidth="1.5" />
      <g fill="url(#stoneGrad)">
        <rect x="12" y="11.5" width="25" height="7" rx="3.5" transform="rotate(-3 24.5 15)" />
        <rect x="12" y="20.5" width="18" height="7" rx="3.5" transform="rotate(2 21 24)" />
        <rect x="12" y="29.5" width="11" height="7" rx="3.5" transform="rotate(-2 17.5 33)" />
      </g>
    </svg>
  )
}

export default function Logo({ markClass = 'h-10 w-10' }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark className={markClass} />
      <span className="font-display leading-none">
        <span className="block text-lg font-bold tracking-tight text-fog-100">Fieldstone</span>
        <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-ember-400">
          Web Co
        </span>
      </span>
    </span>
  )
}
