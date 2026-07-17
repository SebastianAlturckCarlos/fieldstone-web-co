import { ArrowRight } from 'lucide-react'
import Navbar from './components/Navbar'
import About from './components/About'
import Footer from './components/Footer'
import Reveal from './components/Reveal'

// Links back to homepage sections must include the base path so they work
// both in dev (/) and on GitHub Pages (/fieldstone-web-co/).
const HOME = import.meta.env.BASE_URL

export default function AboutPage() {
  return (
    <div className="grain">
      <Navbar />
      <main>
        <header className="relative overflow-hidden pt-36 pb-2 sm:pt-44">
          <div className="glow left-[-10%] top-[-30%] h-110 w-110 bg-ember-600/20" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal>
              <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-ember-400">
                About us
              </p>
              <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-fog-100 sm:text-6xl">
                The company behind <span className="text-gradient">the systems.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fog-400">
                Fieldstone builds and maintains the operational software that multi-crew trade
                businesses run on every day. Here's who you'll be working with — and how we think
                about the systems that carry your business.
              </p>
            </Reveal>
          </div>
        </header>

        <About />

        <section className="relative border-t border-night-700 bg-night-900/40 py-20 text-center sm:py-24">
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
            <Reveal>
              <h2 className="font-display text-3xl font-bold tracking-tight text-fog-100 sm:text-4xl">
                See what this looks like <span className="text-gradient">for your operation.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-fog-400">
                A 30-minute discovery call — we map your workflow from first call to cleared
                payment and show you where the margin leaks are.
              </p>
              <a
                href={`${HOME}#contact`}
                className="group mt-8 inline-flex items-center gap-2 rounded-full bg-linear-to-r from-ember-400 to-ember-600 px-7 py-3.5 font-semibold text-night-950 shadow-lg shadow-ember-600/25 transition-all duration-300 hover:scale-105 hover:shadow-ember-500/40"
              >
                Book a Discovery Call
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
