import { useState } from 'react'
import { postAction, snapshotUrl } from '../lib/api.js'

export function ApprovalQueue({ approvals, onChanged }) {
  const [openId, setOpenId] = useState(null)
  const [busy, setBusy] = useState(false)

  async function act(id, action) {
    setBusy(true)
    try {
      await postAction(`/api/${action}/${id}`)
      onChanged?.()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel p-4">
      <h2 className="label mb-3">
        Approvals{approvals.length > 0 ? ` — ${approvals.length} waiting` : ''}
      </h2>
      {approvals.length === 0 && (
        <p className="font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          Queue clear — the engine drafts autonomously as leads arrive.
        </p>
      )}
      <ul className="space-y-2">
        {approvals.map(d => (
          <li key={d.id} className="rounded-lg border p-3" style={{ borderColor: 'var(--color-border)' }}>
            <button
              className="flex w-full items-center gap-3 text-left"
              onClick={() => setOpenId(openId === d.id ? null : d.id)}
              aria-expanded={openId === d.id}
            >
              <span className="font-mono text-xs rounded px-1.5 py-0.5"
                style={{ background: 'var(--color-muted)', color: 'var(--color-accent)' }}>
                {d.qa_score}
              </span>
              <span className="font-display text-sm font-medium">{d.company_name}</span>
              <span className="ml-auto font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                “{d.subject}”
              </span>
            </button>
            {openId === d.id && (
              <div className="mt-3 space-y-3">
                {d.flaws?.length > 0 && (
                  <div>
                    <div className="label text-[9px] mb-1.5">Audit evidence (why the CEO queued this)</div>
                    <ul className="flex flex-wrap gap-1.5">
                      {d.flaws.map((f, i) => (
                        <li key={i} className="rounded px-2 py-1 font-mono text-[10px]"
                          title={f.detail}
                          style={{
                            background: 'var(--color-muted)',
                            color: f.severity >= 4 ? 'var(--color-warning)' : 'var(--color-muted-foreground)',
                          }}>
                          {f.type} · sev {f.severity}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {d.consult && (
                  <div>
                    <div className="label text-[9px] mb-1.5">
                      Sales Rep consult — click-through {d.consult.click_score}/100
                    </div>
                    {d.consult.notes?.length > 0 && (
                      <ul className="space-y-1 font-mono text-[11px]" style={{ color: 'var(--color-muted-foreground)' }}>
                        {d.consult.notes.map((n, i) => <li key={i}>· {n}</li>)}
                      </ul>
                    )}
                    <p className="mt-1 font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)', opacity: 0.7 }}>
                      Researcher audited · CMO drafted · CEO scored {d.qa_score} · Sales Rep consulted — you decide.
                    </p>
                  </div>
                )}
                <p className="whitespace-pre-wrap rounded-lg p-3 text-sm"
                  style={{ background: 'var(--color-background)', color: 'var(--color-foreground)' }}>
                  {d.body}
                </p>
                {d.has_snapshot && (
                  <div>
                    <div className="label mb-1.5 flex items-center gap-2 text-[9px]">
                      Embedded preview — their branding
                      {d.brand?.primary_color && (
                        <span className="inline-block h-3 w-3 rounded-full border"
                          title={`brand ${d.brand.primary_color} (${d.brand.source})`}
                          style={{ background: d.brand.primary_color, borderColor: 'var(--color-border)' }} />
                      )}
                    </div>
                    <img
                      src={snapshotUrl(d.lead_id)}
                      alt={`Branded mockup preview for ${d.company_name} — this exact image is embedded in the email`}
                      loading="lazy"
                      className="w-full rounded-lg border"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    onClick={() => act(d.id, 'approve')}
                    className="rounded-lg px-4 py-2 text-sm font-semibold transition-transform duration-150 active:scale-[0.97] disabled:opacity-50"
                    style={{ background: 'var(--color-primary)', color: '#020617' }}
                  >
                    Approve
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => act(d.id, 'reject')}
                    className="rounded-lg border px-4 py-2 text-sm transition-transform duration-150 active:scale-[0.97] disabled:opacity-50"
                    style={{ borderColor: 'var(--color-destructive)', color: 'var(--color-destructive)' }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
