import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Wrench, Radar } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { postAction } from '../lib/api.js'

async function fetchGrowth() {
  const res = await fetch('/api/growth')
  if (!res.ok) throw new Error('growth fetch failed')
  return res.json()
}

function MilestoneTracker({ mrr, converted, tier1Price, milestones }) {
  const top = milestones[milestones.length - 1].mrr
  const pct = Math.min(100, (mrr / top) * 100)
  return (
    <div className="panel p-4">
      <h2 className="label mb-3">MRR Milestones</h2>
      <div className="mb-2 flex items-baseline gap-3">
        <span className="font-mono text-3xl font-semibold glow-text" style={{ color: 'var(--color-accent)' }}>
          ${mrr.toLocaleString()}
        </span>
        <span className="font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          MRR · {converted} client{converted === 1 ? '' : 's'} × ${tier1Price} (Tier 1 assumption)
        </span>
      </div>
      <div className="relative h-3 rounded-full" style={{ background: 'var(--color-muted)' }}>
        <div className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--color-glow), var(--color-accent))' }} />
        {milestones.map(m => (
          <div key={m.name} className="absolute -top-1 h-5 w-px"
            style={{ left: `${(m.mrr / top) * 100}%`, background: 'var(--color-foreground)', opacity: 0.5 }} />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
        {milestones.map(m => <span key={m.name}>{m.name} · ${m.mrr.toLocaleString()}</span>)}
      </div>
    </div>
  )
}

function FunnelRates({ funnel, total }) {
  const stages = ['pending', 'audited', 'drafted', 'validated', 'sent', 'converted']
  return (
    <div className="panel p-4">
      <h2 className="label mb-3">Funnel</h2>
      <div className="flex flex-wrap gap-2">
        {stages.map(s => (
          <div key={s} className="rounded-lg px-3 py-2 font-mono text-xs" style={{ background: 'var(--color-muted)' }}>
            <div className="label text-[9px]">{s}</div>
            <div className="text-lg" style={{ color: s === 'converted' ? 'var(--color-success)' : 'var(--color-foreground)' }}>
              {funnel[s] ?? 0}
            </div>
          </div>
        ))}
        <div className="rounded-lg px-3 py-2 font-mono text-xs" style={{ background: 'var(--color-muted)' }}>
          <div className="label text-[9px]">failed</div>
          <div className="text-lg" style={{ color: 'var(--color-destructive)' }}>{funnel.failed ?? 0}</div>
        </div>
        <div className="rounded-lg px-3 py-2 font-mono text-xs" style={{ background: 'var(--color-muted)' }}>
          <div className="label text-[9px]">total</div>
          <div className="text-lg">{total}</div>
        </div>
      </div>
    </div>
  )
}

function TokenTrend({ byDay }) {
  return (
    <div className="panel p-4" style={{ minHeight: 220 }}>
      <h2 className="label mb-3">Engine Activity — tokens/day</h2>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={byDay} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            tickFormatter={d => d?.slice(5)} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#0e1223', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, fontFamily: 'JetBrains Mono', fontSize: 12 }}
            labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#38bdf8' }} />
          <Line type="monotone" dataKey="tokens" stroke="#38BDF8" strokeWidth={2}
            dot={{ r: 3, fill: '#38BDF8' }} name="tokens" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function SkillReview({ skills, onChanged }) {
  const [openId, setOpenId] = useState(null)
  const [running, setRunning] = useState(false)
  const [lastRun, setLastRun] = useState(null)
  const pending = skills.filter(s => s.status === 'pending_review')
  const rest = skills.filter(s => s.status !== 'pending_review')

  async function act(id, action) {
    await postAction(`/api/skills/${id}/${action}`)
    onChanged?.()
  }

  async function runDevAgent() {
    setRunning(true)
    try {
      const res = await postAction('/api/dev-agent/run')
      setLastRun(res)
      onChanged?.()
    } finally {
      setRunning(false)
    }
  }

  const STATUS_COLOR = {
    pending_review: 'var(--color-warning)', active: 'var(--color-success)', disabled: 'var(--color-destructive)',
  }

  const row = s => (
    <li key={s.id} className="rounded-lg border p-3" style={{ borderColor: 'var(--color-border)' }}>
      <button className="flex w-full items-center gap-3 text-left" onClick={() => setOpenId(openId === s.id ? null : s.id)}>
        <span className="font-mono text-xs font-semibold">{s.skill_name}</span>
        <span className="font-mono text-[10px] uppercase" style={{ color: STATUS_COLOR[s.status] }}>{s.status}</span>
        <span className="ml-auto truncate font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
          {s.description}
        </span>
      </button>
      {openId === s.id && (
        <div className="mt-3 space-y-3">
          <pre className="overflow-x-auto rounded-lg p-3 text-[11px] leading-relaxed"
            style={{ background: 'var(--color-background)', color: 'var(--color-muted-foreground)' }}>
            {s.code_body}
          </pre>
          <div className="flex gap-2">
            {s.status !== 'active' && (
              <button onClick={() => act(s.id, 'approve')}
                className="rounded-lg px-4 py-2 text-sm font-semibold"
                style={{ background: 'var(--color-primary)', color: '#020617' }}>
                Approve & activate
              </button>
            )}
            {s.status !== 'disabled' && (
              <button onClick={() => act(s.id, 'disable')}
                className="rounded-lg border px-4 py-2 text-sm"
                style={{ borderColor: 'var(--color-destructive)', color: 'var(--color-destructive)' }}>
                Disable
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  )

  return (
    <div className="panel p-4">
      <div className="mb-1 flex items-center">
        <h2 className="label">
          Skill Factory{pending.length > 0 ? ` — ${pending.length} awaiting review` : ''}
        </h2>
        <button onClick={runDevAgent} disabled={running}
          className="ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs disabled:opacity-50"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-accent)' }}>
          <Wrench size={12} className={running ? 'animate-spin' : ''} />
          {running ? 'scanning memory…' : 'run Dev Agent'}
        </button>
      </div>
      <p className="mb-3 font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
        Dev-Agent code never runs until a human reads and approves it here — it proposes skills by reading
        institutional memory (past failures + QA rejections), not on a fixed schedule alone.
      </p>
      {lastRun && (
        <p className="mb-3 rounded-lg p-2 font-mono text-[11px]"
          style={{ background: 'var(--color-muted)', color: lastRun.proposed ? 'var(--color-accent)' : 'var(--color-muted-foreground)' }}>
          {lastRun.proposed ? `Proposed: ${lastRun.skillId}` : 'No gap found'} — {lastRun.reason}
        </p>
      )}
      <ul className="space-y-2">{[...pending, ...rest].map(row)}</ul>
    </div>
  )
}

function CompetitorIntel({ competitors, onChanged }) {
  const [running, setRunning] = useState(false)
  const notes = competitors?.notes ?? []

  async function run() {
    setRunning(true)
    try {
      await postAction('/api/competitor-scan/run')
      onChanged?.()
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="panel p-4 lg:col-span-2">
      <div className="mb-1 flex items-center">
        <h2 className="label">
          Competitor Intel{competitors?.scanned_at ? ` — ${competitors.scanned_at.slice(0, 10)}` : ''}
        </h2>
        <button onClick={run} disabled={running}
          className="ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs disabled:opacity-50"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-accent)' }}>
          <Radar size={12} className={running ? 'animate-spin' : ''} />
          {running ? 'scanning…' : 'run scan'}
        </button>
      </div>
      <p className="mb-3 font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
        Research + Analytics working the same angle from the outside: what ServiceTitan, Housecall Pro,
        Jobber, FieldEdge, and Service Fusion show on their own public pages, and where Fieldstone's flat
        $399 no-setup-fee model beats it. The sharpest angle feeds straight into the CMO's copy.
      </p>
      {notes.length === 0 ? (
        <p className="font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          No scan yet — runs automatically Sundays, or click run scan.
        </p>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2">
          {notes.map(n => (
            <li key={n.competitor} className="rounded-lg border p-3" style={{ borderColor: 'var(--color-border)' }}>
              <div className="mb-1 flex items-baseline gap-2">
                <span className="font-mono text-xs font-semibold">{n.competitor}</span>
                {n.pricing_signal && (
                  <span className="font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                    {n.pricing_signal}
                  </span>
                )}
              </div>
              <p className="mb-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{n.positioning}</p>
              <p className="text-xs" style={{ color: 'var(--color-accent)' }}>→ {n.fieldstone_angle}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DigestPanel({ digest, onRun }) {
  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center">
        <h2 className="label">Analytics Digest{digest ? ` — ${digest.day}` : ''}</h2>
        <button onClick={onRun} title="Generate digest now"
          className="ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-accent)' }}>
          <RefreshCw size={12} /> run now
        </button>
      </div>
      {digest ? (
        <pre className="whitespace-pre-wrap rounded-lg p-3 text-xs leading-relaxed"
          style={{ background: 'var(--color-background)', color: 'var(--color-foreground)' }}>
          {digest.digest_md}
        </pre>
      ) : (
        <p className="font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          No digest yet — runs automatically at 18:00, or click run now.
        </p>
      )}
    </div>
  )
}

export function GrowthScreen() {
  const [growth, setGrowth] = useState(null)

  const refresh = useCallback(() => { fetchGrowth().then(setGrowth).catch(() => {}) }, [])
  useEffect(() => { refresh() }, [refresh])

  async function runDigest() {
    await postAction('/api/digest')
    refresh()
  }

  if (!growth) return <p className="font-mono text-sm p-4" style={{ color: 'var(--color-muted-foreground)' }}>loading…</p>

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <MilestoneTracker mrr={growth.mrr} converted={growth.converted}
          tier1Price={growth.tier1Price} milestones={growth.milestones} />
      </div>
      <FunnelRates funnel={growth.funnel} total={growth.total} />
      <TokenTrend byDay={growth.byDay} />
      <DigestPanel digest={growth.digest} onRun={runDigest} />
      <SkillReview skills={growth.skills} onChanged={refresh} />
      <CompetitorIntel competitors={growth.competitors} onChanged={refresh} />
    </div>
  )
}
