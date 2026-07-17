import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, RefreshCw, Route } from 'lucide-react'
import { BUSINESS } from '../config'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.12 * i, ease: [0.21, 0.65, 0.36, 1] },
  }),
}

const DISPATCH_ROWS = [
  { tech: 'Crew 4 — M. Alvarez', job: 'Compressor swap · Northland', status: 'On site', tone: 'moss' },
  { tech: 'Crew 9 — T. Okafor', job: 'Repipe est. · Overland Park', status: 'En route', tone: 'ember' },
  { tech: 'Crew 2 — D. Whitfield', job: 'Panel upgrade · Lenexa', status: 'Invoiced', tone: 'fog' },
]

// Ops console that tilts toward the cursor — the "we run your operation" visual.
function OpsMock({ mouseX, mouseY }) {
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10])

  return (
    <motion.div
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className="relative w-full max-w-md rounded-2xl border border-night-600/80 bg-night-900/90 shadow-2xl shadow-black/60"
    >
      <div className="flex items-center gap-1.5 border-b border-night-700 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 flex-1 truncate rounded-md bg-night-800 px-3 py-1 text-[0.65rem] text-fog-500">
          ops.yourcompany.com/dispatch
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            ['Revenue MTD', '$412k'],
            ['Jobs today', '34'],
            ['Trucks live', '15/16'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-night-800 px-3 py-2.5">
              <p className="text-[0.55rem] uppercase tracking-wider text-fog-500">{label}</p>
              <p className="mt-0.5 font-display text-sm font-bold text-fog-100">{value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {DISPATCH_ROWS.map(({ tech, job, status, tone }) => (
            <div
              key={tech}
              className="flex items-center justify-between gap-3 rounded-lg border border-night-700/70 bg-night-800/60 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-[0.65rem] font-semibold text-fog-300">{tech}</p>
                <p className="truncate text-[0.6rem] text-fog-500">{job}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide ${
                  tone === 'moss'
                    ? 'bg-moss-500/15 text-moss-400 ring-1 ring-moss-400/30'
                    : tone === 'ember'
                      ? 'bg-ember-500/15 text-ember-300 ring-1 ring-ember-500/30'
                      : 'bg-night-700 text-fog-400 ring-1 ring-night-600'
                }`}
              >
                {status}
              </span>
            </div>
          ))}
        </div>

        <div className="h-2 rounded-full bg-night-800">
          <div className="h-2 w-3/4 rounded-full bg-linear-to-r from-ember-400 to-ember-600" />
        </div>
      </div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-5 -top-5 flex items-center gap-2 rounded-full border border-ember-400/40 bg-night-900 px-4 py-2 text-xs font-semibold text-ember-300 shadow-lg shadow-ember-600/10"
      >
        <RefreshCw className="h-3.5 w-3.5" /> POS ↔ CRM synced
      </motion.div>
      <motion.div
        animate={{ y: [0, 9, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-5 -left-5 flex items-center gap-2 rounded-full border border-moss-400/40 bg-night-900 px-4 py-2 text-xs font-semibold text-moss-400 shadow-lg"
      >
        <Route className="h-3.5 w-3.5" /> Routes optimized — 18 stops
      </motion.div>
    </motion.div>
  )
}

export default function Hero() {
  const ref = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 20 })

  const onMouseMove = (e) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <section
      id="top"
      ref={ref}
      onMouseMove={onMouseMove}
      className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28"
    >
      {/* Ambient glows */}
      <div className="glow left-[-10%] top-[-15%] h-130 w-130 bg-ember-600/25" />
      <div className="glow right-[-15%] top-[30%] h-110 w-110 bg-ember-400/12" />
      <div className="glow bottom-[-30%] left-[30%] h-100 w-100 bg-moss-500/10" />

      {/* Dotted grid backdrop */}
      <div
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage: 'radial-gradient(circle, #7c7568 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 35%, black, transparent)',
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
            <span className="inline-flex items-center gap-2 rounded-full border border-night-600 bg-night-900/80 px-4 py-1.5 text-xs font-medium tracking-wide text-fog-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ember-400" />
              {BUSINESS.locationLine}
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-fog-100 sm:text-6xl lg:text-7xl"
          >
            Your crews scaled. <span className="text-gradient">Your systems didn't.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-6 max-w-xl text-lg leading-relaxed text-fog-400"
          >
            Fieldstone builds custom CRMs, POS systems, and client portals for{' '}
            <span className="font-semibold text-fog-100">
              established, multi-crew HVAC, plumbing, and electrical operations
            </span>{' '}
            — replacing the spreadsheets, whiteboards, and disconnected apps that quietly bleed
            margin from every job.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <a
              href="#contact"
              className="group flex items-center gap-2 rounded-full bg-linear-to-r from-ember-400 to-ember-600 px-7 py-3.5 font-semibold text-night-950 shadow-lg shadow-ember-600/25 transition-all duration-300 hover:scale-105 hover:shadow-ember-500/40"
            >
              Book a Discovery Call
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#platform"
              className="rounded-full border border-night-600 px-7 py-3.5 font-semibold text-fog-100 transition-colors duration-300 hover:border-ember-400 hover:text-ember-400"
            >
              See the platform
            </a>
          </motion.div>

          <motion.dl
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
            className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-night-700 pt-8"
          >
            {[
              ['99.9%', 'uptime SLA'],
              ['1 system', 'lead to invoice'],
              ['24/7', 'dedicated support'],
            ].map(([stat, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-2xl font-bold text-fog-100 sm:text-3xl">{stat}</dd>
                <dd className="mt-1 text-xs uppercase tracking-wider text-fog-500">{label}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.21, 0.65, 0.36, 1] }}
          className="hidden justify-center lg:flex"
        >
          <OpsMock mouseX={smoothX} mouseY={smoothY} />
        </motion.div>
      </div>
    </section>
  )
}
