// Screen — Backlog: everything already sent or converted. Deliberately the
// quietest screen in the app: no badges, no urgency styling, nothing here
// asks for attention. The ONLY path back into view is a reply, which surfaces
// as a Follow-up draft in the CEO console — this screen is just the archive
// you check when you want to, not one that pulls you in.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Archive, MailOpen } from 'lucide-react'
import { fetchPipeline } from '../lib/api.js'
import { LeadDetail } from './LeadDetail.jsx'

export function BacklogScreen() {
  const [data, setData] = useState(null)
  const [selectedLead, setSelectedLead] = useState(null)

  const refresh = useCallback(async () => {
    try { setData(await fetchPipeline()) } catch { /* engine offline — App shows the banner */ }
  }, [])

  useEffect(() => {
    refresh()
    const poll = setInterval(refresh, 30_000)
    return () => clearInterval(poll)
  }, [refresh])

  const sent = useMemo(
    () => (data?.leads ?? [])
      .filter(l => l.lead_status === 'sent' || l.lead_status === 'converted')
      .sort((a, b) => (b.sent_at ?? '').localeCompare(a.sent_at ?? '')),
    [data],
  )

  if (!data) return <div className="panel p-6 font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>loading backlog…</div>

  return (
    <div className="flex flex-col gap-4">
      <div className="panel p-4">
        <h2 className="label mb-1 flex items-center gap-2">
          <Archive size={12} /> Backlog — {sent.length} sent
        </h2>
        <p className="mb-3 font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
          Nothing here needs you. A reply pulls its lead into the Follow-up queue (CEO console) — that's the
          only reason to come back to this screen outside your own curiosity.
        </p>
        {sent.length === 0 ? (
          <p className="font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Nothing sent yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {sent.map(l => (
              <button key={l.id} onClick={() => setSelectedLead(l.id)}
                className="flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors duration-150 cursor-pointer"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-muted)' }}>
                <span className="truncate font-display text-[13px]" style={{ color: 'var(--color-foreground)' }}>
                  {l.company_name}
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                  {l.trade} · {l.city}
                </span>
                <span className="ml-auto flex items-center gap-2 font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                  {l.lead_status === 'converted' && (
                    <span style={{ color: 'var(--color-success)' }}>converted</span>
                  )}
                  {l.opened_at && <span className="flex items-center gap-1"><MailOpen size={10} /> opened</span>}
                  {l.reply_sentiment && (
                    <span style={{ color: l.reply_sentiment === 'positive' ? 'var(--color-success)' : 'var(--color-muted-foreground)' }}>
                      replied · {l.reply_sentiment}
                    </span>
                  )}
                  {l.sent_at?.slice(0, 10)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedLead && (
        <LeadDetail leadId={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  )
}
