// The CEO console — the human's ONLY job surface. Clicking the CEO in the
// roster (or the CEO node inside the Synapse) opens this: every queue that
// needs a human decision, plus the engine's master controls. Everything else
// runs itself.
import { useState } from 'react'
import { X, Pause, Play, FileText, Wrench, Crown } from 'lucide-react'
import { postAction } from '../lib/api.js'
import { ApprovalQueue } from './ApprovalQueue.jsx'
import { FollowupQueue } from './PipelineScreen.jsx'

export function CEOCommand({ state, onChanged, onClose }) {
  const [busy, setBusy] = useState(null)
  const [note, setNote] = useState(null)

  async function control(path, label) {
    setBusy(label)
    setNote(null)
    try {
      const res = await postAction(path)
      setNote(res.error ?? `${label}: done`)
      onChanged?.()
    } finally {
      setBusy(null)
    }
  }

  const approvals = state?.approvals ?? []
  const replyQueue = state?.replyQueue ?? []
  const paused = state?.sendPaused

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto" role="dialog" aria-modal="true"
      style={{ background: 'rgba(2, 6, 23, 0.82)', backdropFilter: 'blur(6px)' }}>
      <div className="mx-auto my-6 flex w-full max-w-3xl flex-col gap-4 px-4">
        <header className="panel panel--active flex items-center gap-3 px-5 py-4">
          <Crown size={18} style={{ color: 'var(--color-accent)' }} />
          <div>
            <h2 className="font-display text-base font-semibold glow-text">CEO Command</h2>
            <p className="font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
              {approvals.length} draft(s) · {replyQueue.length} follow-up(s) awaiting your decision
              · spend ${state?.spend?.today?.toFixed?.(2) ?? '0.00'} / ${state?.spend?.cap ?? '–'} cap
              · mode {state?.mode}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close CEO console" className="ml-auto rounded-lg p-1.5"
            style={{ color: 'var(--color-muted-foreground)' }}>
            <X size={18} />
          </button>
        </header>

        {paused && (
          <div className="panel px-4 py-2 font-mono text-xs" style={{ color: 'var(--color-warning)' }}>
            ⚠ {paused}
          </div>
        )}
        {note && (
          <div className="panel px-4 py-2 font-mono text-xs" style={{ color: 'var(--color-accent)' }}>
            {note}
          </div>
        )}

        <div className="panel flex flex-wrap items-center gap-2 p-3">
          <span className="label mr-2 text-[9px]">Engine controls</span>
          {paused ? (
            <button disabled={busy} onClick={() => control('/api/send/resume', 'resume sends')}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-semibold disabled:opacity-40"
              style={{ background: 'var(--color-success)', color: '#020617' }}>
              <Play size={11} /> Resume sends
            </button>
          ) : (
            <button disabled={busy} onClick={() => control('/api/send/pause', 'pause sends')}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs disabled:opacity-40"
              style={{ borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }}>
              <Pause size={11} /> Pause sends
            </button>
          )}
          <button disabled={busy} onClick={() => control('/api/digest', 'digest')}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs disabled:opacity-40"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>
            <FileText size={11} /> Run digest
          </button>
          <button disabled={busy} onClick={() => control('/api/dev-agent/run', 'dev agent')}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs disabled:opacity-40"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>
            <Wrench size={11} /> Run Dev Agent
          </button>
        </div>

        <ApprovalQueue approvals={approvals} onChanged={onChanged} />
        <FollowupQueue replyQueue={replyQueue} onChanged={onChanged} />
      </div>
    </div>
  )
}
