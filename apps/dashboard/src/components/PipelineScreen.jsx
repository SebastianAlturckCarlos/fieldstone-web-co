// Screen 2 — Pipeline: the 5-stage funnel with stage-to-stage conversion,
// the dense lead table, and the reply desk (log a reply → Sales Rep
// classifies it → follow-up drafts wait for a human send).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Send, X, MessageSquarePlus, PlayCircle, Loader2 } from 'lucide-react'
import { fetchPipeline, postAction, postJSON } from '../lib/api.js'

const STATUS_COLOR = {
  pending: 'var(--color-muted-foreground)',
  processing: 'var(--color-warning)',
  audited: 'var(--color-primary)',
  drafted: 'var(--color-accent)',
  validated: 'var(--color-primary)',
  sent: 'var(--color-success)',
  converted: 'var(--color-success)',
  failed: 'var(--color-destructive)',
}

function Funnel({ funnel }) {
  const max = Math.max(1, ...funnel.map(f => f.reached))
  const conversions = funnel.filter(f => f.conversionFromPrev !== null).map(f => f.conversionFromPrev)
  const worst = conversions.length ? Math.min(...conversions) : null
  return (
    <div className="panel p-4">
      <h2 className="label mb-3">Funnel — leads reaching each stage</h2>
      <div className="flex flex-col gap-1">
        {funnel.map((f, i) => (
          <div key={f.stage}>
            {f.conversionFromPrev !== null && (
              <div className="my-0.5 pl-24 font-mono text-[10px]"
                style={{ color: f.conversionFromPrev === worst ? 'var(--color-warning)' : 'var(--color-muted-foreground)' }}>
                ↓ {f.conversionFromPrev}%{f.conversionFromPrev === worst ? ' — biggest drop-off' : ''}
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="label w-20 text-right text-[9px]">{f.stage}</span>
              <div className="relative h-6 flex-1 overflow-hidden rounded-md" style={{ background: 'var(--color-muted)' }}>
                <div className="absolute inset-y-0 left-0 rounded-md transition-all duration-500"
                  style={{
                    width: `${Math.max(2, (f.reached / max) * 100)}%`,
                    background: 'linear-gradient(90deg, #0EA5E9, #7DD3FC)',
                  }} />
                <span className="absolute inset-y-0 left-2 flex items-center font-mono text-xs font-semibold"
                  style={{ color: '#020617', mixBlendMode: 'screen', textShadow: '0 0 6px rgba(2,6,23,0.7)' }}>
                  <span style={{ color: 'var(--color-foreground)' }}>{f.reached}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReplyDesk({ leads, onChanged }) {
  const sentLeads = useMemo(
    () => leads.filter(l => l.lead_status === 'sent' && l.outreach_id && !l.reply_sentiment),
    [leads],
  )
  const [outreachId, setOutreachId] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  async function submit() {
    if (!outreachId || !text.trim()) return
    setBusy(true)
    try {
      const res = await postJSON(`/api/replies/${outreachId}`, { text: text.trim() })
      setResult(res.error ?? `classified: ${res.classification?.sentiment} → ${res.classification?.action}`)
      setText('')
      setOutreachId('')
      onChanged?.()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel p-4">
      <h2 className="label mb-3 flex items-center gap-2"><MessageSquarePlus size={12} /> Reply Desk — log an incoming reply</h2>
      {sentLeads.length === 0 ? (
        <p className="font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          No sent emails awaiting a reply. (Webhook-delivered replies classify automatically.)
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <select value={outreachId} onChange={e => setOutreachId(e.target.value)}
            className="rounded-lg border bg-transparent px-3 py-2 font-mono text-xs cursor-pointer"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)', background: 'var(--color-muted)' }}>
            <option value="">— which lead replied? —</option>
            {sentLeads.map(l => (
              <option key={l.outreach_id} value={l.outreach_id}>{l.company_name} ({l.trade})</option>
            ))}
          </select>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
            placeholder="Paste the reply text here…"
            className="rounded-lg border bg-transparent px-3 py-2 font-mono text-xs"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)', background: 'var(--color-muted)' }} />
          <button onClick={submit} disabled={busy || !outreachId || !text.trim()}
            className="flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-transform duration-150 active:scale-[0.97] disabled:opacity-40 cursor-pointer"
            style={{ background: 'var(--color-primary)', color: '#020617' }}>
            {busy ? <Loader2 size={12} className="animate-spin" /> : <PlayCircle size={12} />}
            Classify with Sales Rep
          </button>
        </div>
      )}
      {result && (
        <p className="mt-2 font-mono text-xs" style={{ color: 'var(--color-accent)' }}>{result}</p>
      )}
    </div>
  )
}

export function FollowupQueue({ replyQueue, onChanged }) {
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)

  async function act(id, action) {
    setBusyId(id)
    setError(null)
    try {
      const res = await postAction(`/api/followups/${id}/${action}`)
      if (res.error) setError(res.error)
      onChanged?.()
    } finally {
      setBusyId(null)
    }
  }

  if (!replyQueue?.length) return null
  return (
    <div className="panel panel--active p-4">
      <h2 className="label mb-3">Follow-up drafts — awaiting your send ({replyQueue.length})</h2>
      {error && <p className="mb-2 font-mono text-xs" style={{ color: 'var(--color-warning)' }}>⚠ {error}</p>}
      <div className="flex flex-col gap-3">
        {replyQueue.map(r => (
          <div key={r.id} className="rounded-lg border p-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-muted)' }}>
            <div className="mb-1 flex items-center gap-2 font-mono text-xs">
              <span className="font-semibold" style={{ color: 'var(--color-foreground)' }}>{r.company_name}</span>
              <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase"
                style={{
                  borderColor: r.sentiment === 'positive' ? 'rgba(34,197,94,0.5)' : 'var(--color-border)',
                  color: r.sentiment === 'positive' ? 'var(--color-success)' : 'var(--color-muted-foreground)',
                }}>
                {r.sentiment} · urgency {r.urgency}/5
              </span>
              <span className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>{r.intent}</span>
            </div>
            <p className="mb-1 font-mono text-[11px] italic" style={{ color: 'var(--color-muted-foreground)' }}>
              they said: “{r.reply_text.length > 140 ? r.reply_text.slice(0, 140) + '…' : r.reply_text}”
            </p>
            <p className="mb-2 whitespace-pre-wrap font-mono text-xs" style={{ color: 'var(--color-foreground)' }}>
              {r.suggested_reply}
            </p>
            <div className="flex gap-2">
              <button onClick={() => act(r.id, 'send')} disabled={busyId === r.id}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-transform duration-150 active:scale-[0.97] disabled:opacity-40 cursor-pointer"
                style={{ background: 'var(--color-success)', color: '#020617' }}>
                <Send size={11} /> Send follow-up
              </button>
              <button onClick={() => act(r.id, 'dismiss')} disabled={busyId === r.id}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors duration-150 cursor-pointer"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>
                <X size={11} /> Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LeadTable({ leads }) {
  return (
    <div className="panel overflow-x-auto p-4">
      <h2 className="label mb-3">Leads ({leads.length})</h2>
      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="label text-left text-[9px]">
            <th className="pb-2 pr-3">Company</th>
            <th className="pb-2 pr-3">Trade</th>
            <th className="pb-2 pr-3">City</th>
            <th className="pb-2 pr-3">Status</th>
            <th className="pb-2 pr-3">QA</th>
            <th className="pb-2 pr-3">Opened</th>
            <th className="pb-2 pr-3">Reply</th>
            <th className="pb-2">Updated</th>
          </tr>
        </thead>
        <tbody>
          {leads.map(l => (
            <tr key={l.id} className="border-t" style={{ borderColor: 'var(--color-border)', height: 40 }}>
              <td className="pr-3" style={{ color: 'var(--color-foreground)' }}>{l.company_name}</td>
              <td className="pr-3" style={{ color: 'var(--color-muted-foreground)' }}>{l.trade}</td>
              <td className="pr-3" style={{ color: 'var(--color-muted-foreground)' }}>{l.city}</td>
              <td className="pr-3">
                <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase"
                  style={{ borderColor: 'var(--color-border)', color: STATUS_COLOR[l.lead_status] ?? 'var(--color-foreground)' }}>
                  {l.lead_status}{l.fail_reason ? ` · ${l.fail_reason}` : ''}
                </span>
              </td>
              <td className="pr-3" style={{ color: 'var(--color-muted-foreground)' }}>{l.qa_score ?? '–'}</td>
              <td className="pr-3" style={{ color: l.opened_at ? 'var(--color-success)' : 'var(--color-muted-foreground)' }}>
                {l.opened_at ? 'yes' : '–'}
              </td>
              <td className="pr-3" style={{ color: l.reply_sentiment === 'positive' ? 'var(--color-success)' : 'var(--color-muted-foreground)' }}>
                {l.reply_sentiment ?? '–'}
              </td>
              <td style={{ color: 'var(--color-muted-foreground)' }}>{l.updated_at?.slice(5, 16)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PipelineScreen({ replyQueue, onStateChanged }) {
  const [data, setData] = useState(null)

  const refresh = useCallback(async () => {
    try { setData(await fetchPipeline()) } catch { /* engine offline — App shows the banner */ }
  }, [])

  useEffect(() => {
    refresh()
    const poll = setInterval(refresh, 15_000)
    return () => clearInterval(poll)
  }, [refresh])

  const onChanged = useCallback(() => { refresh(); onStateChanged?.() }, [refresh, onStateChanged])

  if (!data) return <div className="panel p-6 font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>loading pipeline…</div>

  return (
    <div className="flex flex-col gap-4">
      {data.sendPaused && (
        <div className="panel flex items-center gap-3 px-4 py-2 font-mono text-xs" style={{ color: 'var(--color-warning)' }}>
          ⚠ {data.sendPaused}
          <button onClick={async () => { await postAction('/api/send/resume'); onChanged() }}
            className="rounded-lg border px-3 py-1 cursor-pointer transition-colors duration-150"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
            Resume sends
          </button>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Funnel funnel={data.funnel} />
        <ReplyDesk leads={data.leads} onChanged={onChanged} />
      </div>
      <FollowupQueue replyQueue={replyQueue} onChanged={onChanged} />
      <LeadTable leads={data.leads} />
    </div>
  )
}
