import { motion } from 'framer-motion'
import Reveal from './Reveal'
import SocialIcons from './SocialIcons'
import headshot from '../assets/headshot.jpg'
import { BUSINESS } from '../config'

export default function About() {
  return (
    <section id="about" className="relative overflow-hidden py-24 sm:py-32">
      <div className="glow right-[-15%] bottom-[-10%] h-110 w-110 bg-ember-600/10" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <div className="relative mx-auto w-fit">
            {/* Offset ember frame behind the photo */}
            <div className="absolute -inset-3 rotate-3 rounded-3xl bg-linear-to-br from-ember-400/40 to-ember-600/10" />
            <motion.img
              src={headshot}
              alt="Sebastian, founder of Fieldstone Web Co"
              initial={{ rotate: -2 }}
              whileHover={{ rotate: 0, scale: 1.02 }}
              transition={{ duration: 0.4 }}
              className="relative h-105 w-80 rounded-3xl border border-night-600 object-cover object-top shadow-2xl shadow-black/50 sm:h-120 sm:w-95"
            />
            <div className="absolute -bottom-5 -right-5 rounded-2xl border border-night-600 bg-night-900/95 px-5 py-3 shadow-xl backdrop-blur">
              <p className="font-display font-semibold text-fog-100">Sebastian</p>
              <p className="text-xs text-ember-400">Founder & Lead Engineer</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-ember-400">
            Who you're working with
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-fog-100 sm:text-5xl">
            Software built by someone <span className="text-gradient">who answers the phone.</span>
          </h2>
          <div className="mt-6 space-y-4 leading-relaxed text-fog-400">
            <p>
              I'm Sebastian, founder of {BUSINESS.name}. I build operational software for trade
              businesses that have outgrown their tools — the shops whose crews kept multiplying
              while the back office still runs on the spreadsheets they used at two trucks.
            </p>
            <p>
              Off-the-shelf platforms make your operation bend to their workflow. I do the
              opposite: study how your dispatchers, estimators, and techs actually work, then
              build the system around it. And when you need something changed, you talk{' '}
              <span className="font-semibold text-fog-100">directly to the engineer who built it</span>{' '}
              — no account managers, no ticket queues.
            </p>
            <p>
              Like a fieldstone wall, good software is built to carry weight for decades — one
              solid piece at a time.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <a
              href={`${import.meta.env.BASE_URL}#contact`}
              className="rounded-full bg-linear-to-r from-ember-400 to-ember-600 px-7 py-3.5 font-semibold text-night-950 transition-transform duration-300 hover:scale-105"
            >
              Book a Discovery Call
            </a>
            <SocialIcons />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
