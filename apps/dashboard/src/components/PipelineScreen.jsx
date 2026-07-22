// Screen 2 — Pipeline: the 5-stage funnel with stage-to-stage conversion, a
// clickable Kanban board (click any lead card for the full drill-down:
// audit, brand, snapshot, drafts, agent reasoning), and the reply desk.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Send, X, MessageSquarePlus, PlayCircle, Loader2, Image as ImageIcon, MailOpen } from 'lucide-react'
import { fetchPipeline, postAction, postJSON } from '../lib/api.js'
import { LeadDetail, STATUS_COLOR } from './LeadDetail.jsx'

function Funnel({ funnel }) {
  const max = Math.max(1, ...funnel.map(f => f.reached))
  const conversions = funnel.filter(f => f.conversionFromPrev !== null).map(f => f.conversionFromPrev)
  const worst = conversions.length ? Math.min(...conversions) : null
  return (
    <div className="panel p-4">
      <h2 className="label mb-3">Funnel — leads reaching each stage</h2>
      <div className="flex flex-col gap-1">
        {funnel.map(f => (
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
                <span className="absolute inset-y-0 left-2 flex items-center font-mono text-xs font-semibold">
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

// The board's stages — active work only. Once a lead is sent it moves to
// the Backlog screen (its own tab, not this board): that's the "10 to
// approve, then 10 more queue up" operating model — sent mail is done, it
// doesn't need daily attention here, only when a reply pulls it back in via
// the Follow-up queue. 'pending' absorbs 'processing' (a lead mid-claim is
// still, from the human's seat, waiting).
const BOARD_STAGES = [
  ['pending', 'Pending', ['pending', 'processing']],
  ['audited', 'Audited', ['audited']],
  ['drafted', 'Drafted', ['drafted']],
  ['validated', 'Approved', ['validated']],
  ['failed', 'Failed', ['failed']],
]

function LeadCard({ lead, onOpen }) {
  return (
    <button
      onClick={() => onOpen(lead.id)}
      className="w-full rounded-lg border p-2.5 text-left transition-all duration-150 hover:-translate-y-px active:scale-[0.98]"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-muted)' }}
    >
      <div className="truncate font-display text-[13px] font-medium" style={{ color: 'var(--color-foreground)' }}>
        {lead.company_name}
      </div>
      <div className="mt-0.5 truncate font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
        {lead.trade} · {lead.city}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-[9px] uppercase">
        {lead.qa_score != null && (
          <span className="rounded px-1 py-0.5" style={{ background: 'var(--color-card)', color: 'var(--color-accent)' }}>
            QA {lead.qa_score}
          </span>
        )}
        {!!lead.has_snapshot && (
          <span title="branded preview embedded" className="flex items-center gap-0.5 rounded px-1 py-0.5"
            style={{ background: 'var(--color-card)', color: 'var(--color-primary)' }}>
            <ImageIcon size={9} /> preview
          </span>
        )}
        {lead.opened_at && (
          <span title="opened" className="flex items-center gap-0.5 rounded px-1 py-0.5"
            style={{ background: 'var(--color-card)', color: 'var(--color-success)' }}>
            <MailOpen size={9} /> opened
          </span>
        )}
        {lead.reply_sentiment && (
          <span className="rounded px-1 py-0.5"
            style={{
              background: 'var(--color-card)',
              color: lead.reply_sentiment === 'positive' ? 'var(--color-success)' : 'var(--color-muted-foreground)',
            }}>
            {lead.reply_sentiment}
          </span>
        )}
        {lead.fail_reason && (
          <span className="rounded px-1 py-0.5" style={{ background: 'var(--color-card)', color: 'var(--color-destructive)' }}>
            {lead.fail_reason}
          </span>
        )}
      </div>
    </button>
  )
}

function KanbanBoard({ leads, onOpen }) {
  const columns = useMemo(() => BOARD_STAGES.map(([key, label, statuses]) => ({
    key, label,
    leads: leads.filter(l => statuses.includes(l.lead_status)),
  })), [leads])

  return (
    <div className="panel p-4">
      <h2 className="label mb-3">Board — click a lead for the full story</h2>
      <div className="grid auto-cols-[230px] grid-flow-col gap-3 overflow-x-auto pb-1">
        {columns.map(col => (
          <div key={col.key} className="flex min-h-40 flex-col gap-2 rounded-xl p-2"
            style={{ background: 'rgba(2,6,23,0.45)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2 px-1 pt-1">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full"
                style={{ background: STATUS_COLOR[col.key], boxShadow: `0 0 8px ${col.key === 'pending' ? 'transparent' : STATUS_COLOR[col.key]}` }} />
              <span className="label text-[9px]">{col.label}</span>
              <span className="ml-auto font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                {col.leads.length}
              </span>
            </div>
            {col.leads.map(l => <LeadCard key={l.id} lead={l} onOpen={onOpen} />)}
            {col.leads.length === 0 && (
              <div className="flex flex-1 items-center justify-center font-mono text-[10px]"
                style={{ color: 'var(--color-muted-foreground)', opacity: 0.5 }}>
                empty
              </div>
            )}
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

export function PipelineScreen({ replyQueue, onStateChanged }) {
  const [data, setData] = useState(null)
  const [selectedLead, setSelectedLead] = useState(null)

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
      <KanbanBoard leads={data.leads} onOpen={setSelectedLead} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Funnel funnel={data.funnel} />
        <ReplyDesk leads={data.leads} onChanged={onChanged} />
      </div>
      <FollowupQueue replyQueue={replyQueue} onChanged={onChanged} />

      {selectedLead && (
        <LeadDetail leadId={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  )
}
