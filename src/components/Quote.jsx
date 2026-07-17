import { useState } from 'react'
import { Send, CheckCircle2, LoaderCircle } from 'lucide-react'
import Reveal from './Reveal'
import { BUSINESS } from '../config'

const inputClass =
  'w-full rounded-xl border border-night-600 bg-night-900/80 px-4 py-3 text-fog-100 placeholder-fog-500 outline-none transition-colors focus:border-ember-400 focus:ring-1 focus:ring-ember-400/50'

export default function Quote() {
  const [status, setStatus] = useState('idle') // idle | sending | sent

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.target
    const data = Object.fromEntries(new FormData(form))
    setStatus('sending')

    try {
      const res = await fetch(`https://formsubmit.co/ajax/${BUSINESS.quoteEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `Discovery call request — ${data.company || data.name}`,
          ...data,
        }),
      })
      if (!res.ok) throw new Error('send failed')
      setStatus('sent')
      form.reset()
    } catch {
      // Fallback: open the visitor's email app pre-filled so no lead is lost.
      const body = encodeURIComponent(
        `Name: ${data.name}\nCompany: ${data.company}\nTrade: ${data.trade}\nFleet size: ${data.fleet}\nPhone/Email: ${data.contact}\n\n${data.message}`
      )
      window.location.href = `mailto:${BUSINESS.quoteEmail}?subject=Discovery%20call%20request&body=${body}`
      setStatus('idle')
    }
  }

  return (
    <section id="contact" className="relative overflow-hidden border-t border-night-700 bg-night-900/40 py-24 sm:py-32">
      <div className="glow left-[20%] top-[-20%] h-100 w-100 bg-ember-500/12" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-ember-400">
            Book a discovery call
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-fog-100 sm:text-5xl">
            Let's find the bottleneck <span className="text-gradient">costing you the most.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-fog-400">
            A 30-minute working session with our team. We'll map your current workflow from first
            call to final invoice and show you exactly what a connected system looks like for your
            operation. No obligation, no slideware.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          {status === 'sent' ? (
            <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl border border-moss-400/40 bg-night-900 p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-moss-400" />
              <h3 className="font-display text-2xl font-semibold text-fog-100">Request received</h3>
              <p className="max-w-sm text-fog-400">
                We'll reach out within one business day to schedule your discovery call.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-12 grid gap-4 sm:grid-cols-2">
              <input name="name" required placeholder="Your name" className={inputClass} />
              <input name="company" required placeholder="Company name" className={inputClass} />
              <select name="trade" required defaultValue="" className={inputClass}>
                <option value="" disabled>
                  Your trade
                </option>
                <option>HVAC</option>
                <option>Plumbing</option>
                <option>Electrical</option>
                <option>Multi-trade / Other</option>
              </select>
              <select name="fleet" required defaultValue="" className={inputClass}>
                <option value="" disabled>
                  Fleet size
                </option>
                <option>1–5 trucks</option>
                <option>6–15 trucks</option>
                <option>16–30 trucks</option>
                <option>30+ trucks</option>
              </select>
              <input
                name="contact"
                required
                placeholder="Phone or email"
                className={`${inputClass} sm:col-span-2`}
              />
              <textarea
                name="message"
                rows="4"
                placeholder="What's the biggest operational headache right now — quoting, dispatch, payments?"
                className={`${inputClass} resize-none sm:col-span-2`}
              />
              <button
                type="submit"
                disabled={status === 'sending'}
                className="group flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-ember-400 to-ember-600 px-7 py-4 font-semibold text-night-950 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-ember-500/30 disabled:opacity-60 sm:col-span-2"
              >
                {status === 'sending' ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    Book my discovery call
                    <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}
