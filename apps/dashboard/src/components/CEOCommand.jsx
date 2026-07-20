// The CEO tab — the human's ONLY job surface, and the home of everything the
// minimalist landing screen gave up: approvals, follow-ups, engine controls,
// the agent roster, the live activity feed, and the KPI strip. The Mission
// tab is the sphere; this is the cockpit.
import { useState } from 'react'
import { Pause, Play, FileText, Wrench, Crown } from 'lucide-react'
import { postAction } from '../lib/api.js'
import { ApprovalQueue } from './ApprovalQueue.jsx'
import { FollowupQueue } from './PipelineScreen.jsx'
import { AgentRoster } from './AgentRoster.jsx'
import { ActivityFeed } from './ActivityFeed.jsx'
import { KpiTile } from './KpiTile.jsx'

export function CEOCommand({ state, feed, onChanged, onSelectAgent }) {
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
  const funnel = state?.funnel ?? {}

  return (
    <div className="flex flex-col gap-4">
      <header className="panel panel--active flex flex-wrap items-center gap-3 px-5 py-4">
        <Crown size={18} style={{ color: 'var(--color-accent)' }} />
        <div>
          <h2 className="font-display text-base font-semibold glow-text">CEO Command</h2>
          <p className="font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
            {approvals.length} draft(s) · {replyQueue.length} follow-up(s) awaiting your decision
            · spend ${state?.spend?.today?.toFixed?.(2) ?? '0.00'} / ${state?.spend?.cap ?? '–'} cap
            · mode {state?.mode}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <KpiTile label="Pending" value={funnel.pending ?? '–'} />
        <KpiTile label="Drafted" value={funnel.drafted ?? '–'} accent />
        <KpiTile label="Validated" value={funnel.validated ?? '–'} />
        <KpiTile label="Sent / Converted" value={`${funnel.sent ?? 0} / ${funnel.converted ?? 0}`} />
        {state?.mode === 'api' ? (
          <KpiTile
            label="API Spend Today"
            value={`$${(state?.spend.today ?? 0).toFixed(2)}`}
            sub={`cap $${state?.spend.cap ?? '–'} · ${state?.tokens.runs ?? 0} runs`}
          />
        ) : (
          <KpiTile
            label="Engine Cost"
            value="$0.00"
            sub={`${state?.mode === 'claude-code' ? 'Claude subscription' : 'dry-run'} · ${state?.tokens?.runs ?? 0} runs · no per-token billing`}
          />
        )}
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-[260px_1fr]">
        <div className="flex min-w-0 flex-col gap-4">
          <AgentRoster roster={state?.roster ?? []} onSelect={onSelectAgent} />
          <ActivityFeed items={feed ?? []} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <ApprovalQueue approvals={approvals} onChanged={onChanged} />
          <FollowupQueue replyQueue={replyQueue} onChanged={onChanged} />
        </div>
      </div>
    </div>
  )
}
