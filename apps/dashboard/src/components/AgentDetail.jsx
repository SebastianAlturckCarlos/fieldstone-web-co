import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts'
import { fetchAgent } from '../lib/api.js'

export function AgentDetail({ agentId, onClose }) {
  const [agent, setAgent] = useState(null)

  useEffect(() => {
    setAgent(null)
    fetchAgent(agentId).then(setAgent).catch(() => onClose())
  }, [agentId, onClose])

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true"
      onClick={onClose} style={{ background: 'rgba(2, 6, 23, 0.6)', backdropFilter: 'blur(4px)' }}>
      <aside
        onClick={e => e.stopPropagation()}
        className="panel feed-in m-4 flex w-full max-w-md flex-col overflow-y-auto p-5"
      >
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-display text-lg font-semibold glow-text">
            {agent ? `${agent.label} — ${agent.id}` : 'loading…'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="ml-auto rounded-lg p-1.5"
            style={{ color: 'var(--color-muted-foreground)' }}>
            <X size={18} />
          </button>
        </div>

        {agent && (
          <>
            <p className="text-sm mb-4" style={{ color: 'var(--color-muted-foreground)' }}>{agent.role}</p>

            <div className="mb-4 grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="rounded-lg p-2" style={{ background: 'var(--color-muted)' }}>
                <div className="label text-[9px]">Provider</div>{agent.provider}
              </div>
              <div className="rounded-lg p-2" style={{ background: 'var(--color-muted)' }}>
                <div className="label text-[9px]">Model</div>{agent.model}
              </div>
              <div className="rounded-lg p-2" style={{ background: 'var(--color-muted)' }}>
                <div className="label text-[9px]">Runs (all time)</div>{agent.totals.runs}
              </div>
              <div className="rounded-lg p-2" style={{ background: 'var(--color-muted)' }}>
                <div className="label text-[9px]">Avg duration</div>{Math.round(agent.totals.avg_ms)}ms
              </div>
              <div className="rounded-lg p-2" style={{ background: 'var(--color-muted)' }}>
                <div className="label text-[9px]">Tokens in / out</div>{agent.totals.tin} / {agent.totals.tout}
              </div>
              <div className="rounded-lg p-2" style={{ background: 'var(--color-muted)' }}>
                <div className="label text-[9px]">Est. spend</div>${agent.totals.cost.toFixed(4)}
              </div>
            </div>

            {agent.recent.length > 1 && (
              <>
                <h3 className="label mb-2">Token usage — recent runs</h3>
                <div className="mb-4 rounded-lg p-2" style={{ background: 'var(--color-background)' }}>
                  <ResponsiveContainer width="100%" height={70}>
                    <AreaChart data={[...agent.recent].reverse().map((r, i) => ({
                      i, total: r.input_tokens + r.output_tokens,
                    }))}>
                      <defs>
                        <linearGradient id="tokfade" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#38BDF8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip contentStyle={{ background: '#0e1223', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, fontFamily: 'JetBrains Mono', fontSize: 11 }}
                        labelFormatter={() => ''} formatter={v => [`${v} tokens`, '']} />
                      <Area type="monotone" dataKey="total" stroke="#38BDF8" strokeWidth={1.5} fill="url(#tokfade)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {agent.verdicts?.length > 0 && (
              <>
                <h3 className="label mb-2">Verdict history</h3>
                <ul className="mb-4 space-y-1 font-mono text-[11px]">
                  {agent.verdicts.map((v, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="rounded px-1.5 py-0.5"
                        style={{
                          background: 'var(--color-muted)',
                          color: v.qa_score >= 80 ? 'var(--color-success)' : 'var(--color-warning)',
                        }}>
                        {v.qa_score}
                      </span>
                      <span className="truncate">{v.company_name}</span>
                      <span className="ml-auto" style={{
                        color: v.approved_by === 'human' ? 'var(--color-success)'
                          : v.approved_by === 'human_rejected' ? 'var(--color-destructive)'
                          : 'var(--color-muted-foreground)',
                      }}>
                        {v.approved_by ?? 'awaiting human'}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <h3 className="label mb-2">Recent runs</h3>
            <ul className="mb-4 space-y-1 font-mono text-[11px]">
              {agent.recent.length === 0 && (
                <li style={{ color: 'var(--color-muted-foreground)' }}>no runs yet</li>
              )}
              {agent.recent.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span style={{ color: 'var(--color-muted-foreground)' }}>
                    {new Date(r.ran_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{ color: 'var(--color-accent)' }}>{r.mode}</span>
                  <span className="truncate">{r.company_name ?? '—'}</span>
                  <span className="ml-auto" style={{ color: 'var(--color-muted-foreground)' }}>
                    {r.input_tokens}/{r.output_tokens}tk
                  </span>
                </li>
              ))}
            </ul>

            <h3 className="label mb-2">Prompt constraints</h3>
            <p className="whitespace-pre-wrap rounded-lg p-3 text-xs leading-relaxed"
              style={{ background: 'var(--color-background)', color: 'var(--color-muted-foreground)' }}>
              {agent.system || '—'}
            </p>
          </>
        )}
      </aside>
    </div>
  )
}
