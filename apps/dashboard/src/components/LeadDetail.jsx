// Lead drill-down drawer — click any card on the Pipeline board to get the
// whole story: scrape + audit evidence, captured brand assets, the branded
// snapshot the email embeds, every draft with its QA/consult verdicts, and
// the agent-run timeline (who thought, with what model, for how long).
import { useEffect, useState } from 'react'
import { X, ExternalLink, Globe, ImageOff } from 'lucide-react'
import { fetchLead, snapshotUrl } from '../lib/api.js'

export const STATUS_COLOR = {
  pending: 'var(--color-muted-foreground)',
  processing: 'var(--color-warning)',
  audited: 'var(--color-primary)',
  drafted: 'var(--color-accent)',
  validated: 'var(--color-primary)',
  sent: 'var(--color-success)',
  converted: 'var(--color-success)',
  failed: 'var(--color-destructive)',
}

const AGENT_LABELS = {
  ceo_agent: 'CEO',
  researcher_agent: 'Researcher',
  cmo_agent: 'CMO',
  sales_rep_agent: 'Sales Rep',
  sales_consult: 'Sales Consult',
  analytics_agent: 'Analytics',
  dev_agent: 'Dev Agent',
}

function Section({ title, children }) {
  return (
    <section className="mb-4">
      <h3 className="label mb-2 text-[9px]">{title}</h3>
      {children}
    </section>
  )
}

function Stamp({ label, value, tone }) {
  if (!value) return null
  return (
    <span className="rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase"
      style={{ borderColor: 'var(--color-border)', color: tone ?? 'var(--color-muted-foreground)' }}>
      {label} {String(value).slice(5, 16)}
    </span>
  )
}

export function LeadDetail({ leadId, onClose }) {
  const [lead, setLead] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLead(null)
    setError(null)
    fetchLead(leadId).then(setLead).catch(e => setError(e.message))
  }, [leadId])

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const latestEmail = lead?.emails?.[0]

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true"
      onClick={onClose} style={{ background: 'rgba(2, 6, 23, 0.6)', backdropFilter: 'blur(4px)' }}>
      <aside
        onClick={e => e.stopPropagation()}
        className="panel feed-in m-4 flex w-full max-w-xl flex-col overflow-y-auto p-5"
      >
        <div className="mb-1 flex items-start gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-semibold glow-text">
              {lead?.company_name ?? 'loading…'}
            </h2>
            {lead && (
              <p className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[11px]"
                style={{ color: 'var(--color-muted-foreground)' }}>
                {lead.trade} · {lead.city}
                <a href={lead.website_url} target="_blank" rel="noreferrer"
                  className="pointer-events-auto inline-flex items-center gap-1 underline-offset-2 hover:underline"
                  style={{ color: 'var(--color-primary)' }}>
                  <Globe size={11} /> site <ExternalLink size={9} />
                </a>
              </p>
            )}
          </div>
          {lead && (
            <span className="ml-auto shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase"
              style={{ borderColor: 'var(--color-border)', color: STATUS_COLOR[lead.lead_status] }}>
              {lead.lead_status}{lead.fail_reason ? ` · ${lead.fail_reason}` : ''}
            </span>
          )}
          <button onClick={onClose} aria-label="Close" className="shrink-0 rounded-lg p-1.5"
            style={{ color: 'var(--color-muted-foreground)' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <p className="mt-4 font-mono text-xs" style={{ color: 'var(--color-destructive)' }}>{error}</p>
        )}

        {lead && (
          <div className="mt-4">
            {latestEmail?.has_snapshot ? (
              <Section title="Embedded preview — their branding, as sent">
                <img
                  src={snapshotUrl(lead.id)}
                  alt={`Branded mockup preview for ${lead.company_name}`}
                  loading="lazy"
                  className="w-full rounded-lg border"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </Section>
            ) : (
              <Section title="Embedded preview">
                <p className="flex items-center gap-2 font-mono text-[11px]" style={{ color: 'var(--color-muted-foreground)' }}>
                  <ImageOff size={12} /> not rendered yet — generated at draft time
                </p>
              </Section>
            )}

            <Section title="Captured brand">
              {lead.brand ? (
                <div className="flex flex-wrap items-center gap-2">
                  {(lead.brand.palette?.length ? lead.brand.palette : [lead.brand.primary_color]).filter(Boolean).map(c => (
                    <span key={c} title={c} className="h-6 w-6 rounded-full border"
                      style={{ background: c, borderColor: 'var(--color-border)' }} />
                  ))}
                  {lead.brand.logo_url && (
                    <img src={lead.brand.logo_url} alt="prospect logo" loading="lazy"
                      className="h-8 max-w-28 rounded object-contain"
                      style={{ background: 'rgba(248,250,252,0.9)', padding: 2 }} />
                  )}
                  <span className="font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                    via {lead.brand.source ?? 'site scrape'}
                  </span>
                </div>
              ) : (
                <p className="font-mono text-[11px]" style={{ color: 'var(--color-muted-foreground)' }}>
                  none captured — mockup falls back to the Fieldstone theme
                </p>
              )}
            </Section>

            <Section title={`Audit evidence${lead.audit?.flaws ? ` — ${lead.audit.flaws.length} flaw(s)` : ''}`}>
              {lead.audit?.flaws?.length ? (
                <ul className="space-y-1.5">
                  {lead.audit.flaws.map((f, i) => (
                    <li key={i} className="rounded-lg p-2.5" style={{ background: 'var(--color-muted)' }}>
                      <div className="flex items-center gap-2 font-mono text-[10px] uppercase">
                        <span style={{ color: f.severity >= 4 ? 'var(--color-warning)' : 'var(--color-primary)' }}>
                          {f.type} · sev {f.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-xs" style={{ color: 'var(--color-foreground)' }}>{f.detail}</p>
                      {f.evidence && (
                        <p className="mt-0.5 font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                          evidence: {f.evidence}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-mono text-[11px]" style={{ color: 'var(--color-muted-foreground)' }}>
                  {lead.lead_status === 'pending' ? 'not audited yet' : 'no audit stored'}
                </p>
              )}
            </Section>

            {lead.emails.map(e => (
              <Section key={e.id} title={`Draft #${e.id} — QA ${e.qa_score ?? '–'}${e.approved_by ? ` · ${e.approved_by}` : ' · awaiting approval'}`}>
                <div className="rounded-lg p-3" style={{ background: 'var(--color-background)' }}>
                  <p className="mb-2 font-mono text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>
                    “{e.subject}”
                  </p>
                  <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--color-foreground)' }}>{e.body}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Stamp label="sent" value={e.sent_at} tone="var(--color-success)" />
                  <Stamp label="opened" value={e.opened_at} tone="var(--color-success)" />
                  <Stamp label="replied" value={e.replied_at} tone="var(--color-accent)" />
                  {e.reply_sentiment && (
                    <span className="rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase"
                      style={{
                        borderColor: 'var(--color-border)',
                        color: e.reply_sentiment === 'positive' ? 'var(--color-success)' : 'var(--color-muted-foreground)',
                      }}>
                      {e.reply_sentiment}
                    </span>
                  )}
                </div>
                {e.consult && (
                  <div className="mt-2 rounded-lg p-2.5" style={{ background: 'var(--color-muted)' }}>
                    <div className="label text-[9px]">Sales Rep consult — click-through {e.consult.click_score}/100</div>
                    {e.consult.notes?.length > 0 && (
                      <ul className="mt-1 space-y-0.5 font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                        {e.consult.notes.map((n, i) => <li key={i}>· {n}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </Section>
            ))}

            {lead.memory?.length > 0 && (
              <Section title="Engine memory — what the agents argued about">
                <ul className="space-y-1 font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                  {lead.memory.map((m, i) => (
                    <li key={i} className="rounded-lg p-2" style={{ background: 'var(--color-muted)' }}>
                      <span style={{ color: 'var(--color-warning)' }}>{m.tag}</span>
                      {m.payload?.score != null && <> · score {m.payload.score}</>}
                      {m.payload?.feedback && <p className="mt-0.5">{m.payload.feedback}</p>}
                      {m.payload?.reason && <> · {m.payload.reason}</>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {lead.runs?.length > 0 && (
              <Section title={`Agent activity — ${lead.runs.length} run(s)`}>
                <ul className="space-y-0.5 font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                  {lead.runs.map((r, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-24 shrink-0" style={{ color: 'var(--color-foreground)' }}>
                        {AGENT_LABELS[r.agent_id] ?? r.agent_id}
                      </span>
                      <span className="truncate">{r.model} · {r.mode}</span>
                      <span className="ml-auto shrink-0">
                        {r.input_tokens}→{r.output_tokens} tok · {r.duration_ms != null ? `${(r.duration_ms / 1000).toFixed(1)}s` : '–'}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}
