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
          _subject: `New website request — ${data.business || data.name}`,
          ...data,
        }),
      })
      if (!res.ok) throw new Error('send failed')
      setStatus('sent')
      form.reset()
    } catch {
      // Fallback: open the visitor's email app pre-filled so no lead is lost.
      const body = encodeURIComponent(
        `Name: ${data.name}\nBusiness: ${data.business}\nPhone/Email: ${data.contact}\n\n${data.message}`
      )
      window.location.href = `mailto:${BUSINESS.quoteEmail}?subject=Website%20request&body=${body}`
      setStatus('idle')
    }
  }

  return (
    <section id="quote" className="relative border-t border-night-700 bg-night-900/40 py-24 sm:py-32">
      <div className="glow left-[20%] top-[-20%] h-100 w-100 bg-ember-500/12" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-ember-400">
            Get started
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-fog-100 sm:text-5xl">
            Your website could be live <span className="text-gradient">this week.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-fog-400">
            Tell us a little about your business and we'll get back to you the same day — no
            commitment, no pressure.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          {status === 'sent' ? (
            <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl border border-moss-400/40 bg-night-900 p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-moss-400" />
              <h3 className="font-display text-2xl font-semibold text-fog-100">Request sent!</h3>
              <p className="max-w-sm text-fog-400">
                Thanks for reaching out — we'll get back to you today. Talk soon!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-12 grid gap-4 sm:grid-cols-2">
              <input name="name" required placeholder="Your name" className={inputClass} />
              <input name="business" placeholder="Business name" className={inputClass} />
              <input
                name="contact"
                required
                placeholder="Phone or email"
                className={`${inputClass} sm:col-span-2`}
              />
              <textarea
                name="message"
                rows="4"
                placeholder="What does your business do? What do you need?"
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
                    Send my request
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
