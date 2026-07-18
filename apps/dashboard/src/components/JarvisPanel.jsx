// Sprint 6 — JARVIS. Talk to the engine: status questions, approvals, caps,
// digest — all through the whitelisted /api/jarvis protocol. Voice in/out is
// the Web Speech API (free, local, degrades to text-only when unsupported).
import { useEffect, useRef, useState } from 'react'
import { Send, Mic, MicOff, Volume2, VolumeX, Sparkles, X } from 'lucide-react'
import { postJSON } from '../lib/api.js'

const Rec = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null

export function JarvisPanel({ onChanged, onClose }) {
  const [log, setLog] = useState([
    { who: 'jarvis', text: 'Online. Ask about the pipeline, or tell me to approve, pause, or run the digest.' },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [speak, setSpeak] = useState(false)
  const recRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [log])
  useEffect(() => () => { recRef.current?.abort?.(); window.speechSynthesis?.cancel() }, [])

  async function ask(text) {
    const message = text.trim()
    if (!message || busy) return
    setLog(l => [...l, { who: 'you', text: message }])
    setInput('')
    setBusy(true)
    try {
      const res = await postJSON('/api/jarvis', { message })
      const reply = res.reply ?? res.error ?? 'No response.'
      setLog(l => [...l, { who: 'jarvis', text: reply }])
      if (speak && window.speechSynthesis) {
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(reply))
      }
      onChanged?.()
    } catch {
      setLog(l => [...l, { who: 'jarvis', text: 'Engine unreachable.' }])
    } finally {
      setBusy(false)
    }
  }

  function toggleMic() {
    if (!Rec) return
    if (listening) { recRef.current?.stop(); return }
    const rec = new Rec()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.onresult = e => ask(e.results[0][0].transcript)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    setListening(true)
    rec.start()
  }

  return (
    <div className="panel panel--active fixed bottom-4 right-4 z-40 flex h-[420px] w-[340px] flex-col overflow-hidden"
      role="dialog" aria-label="JARVIS">
      <header className="flex items-center gap-2 border-b px-4 py-2.5" style={{ borderColor: 'var(--color-border)' }}>
        <Sparkles size={13} style={{ color: 'var(--color-accent)' }} />
        <span className="label text-[10px]">JARVIS</span>
        <button onClick={() => setSpeak(s => !s)} aria-label={speak ? 'Mute voice' : 'Enable voice'}
          className="ml-auto rounded p-1" style={{ color: speak ? 'var(--color-accent)' : 'var(--color-muted-foreground)' }}>
          {speak ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>
        <button onClick={onClose} aria-label="Close JARVIS" className="rounded p-1"
          style={{ color: 'var(--color-muted-foreground)' }}>
          <X size={13} />
        </button>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {log.map((m, i) => (
          <p key={i} className="feed-in whitespace-pre-wrap rounded-lg px-3 py-2 font-mono text-[11px] leading-relaxed"
            style={m.who === 'jarvis'
              ? { background: 'var(--color-muted)', color: 'var(--color-foreground)' }
              : { background: 'rgba(56,189,248,0.12)', color: 'var(--color-accent)', marginLeft: 24 }}>
            {m.text}
          </p>
        ))}
        {busy && (
          <p className="font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>thinking…</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="flex items-center gap-2 border-t p-2.5" style={{ borderColor: 'var(--color-border)' }}
        onSubmit={e => { e.preventDefault(); ask(input) }}>
        {Rec && (
          <button type="button" onClick={toggleMic} aria-label={listening ? 'Stop listening' : 'Speak'}
            className="rounded-lg border p-2"
            style={listening
              ? { borderColor: 'var(--color-destructive)', color: 'var(--color-destructive)' }
              : { borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>
            {listening ? <MicOff size={13} /> : <Mic size={13} />}
          </button>
        )}
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="how did we do today?"
          className="min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-2 font-mono text-[11px]"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send"
          className="rounded-lg p-2 disabled:opacity-40"
          style={{ background: 'var(--color-primary)', color: '#020617' }}>
          <Send size={13} />
        </button>
      </form>
    </div>
  )
}
