const KIND_COLOR = {
  fail: 'var(--color-destructive)',
  alert: 'var(--color-warning)',
  approve: 'var(--color-success)',
  drafted: 'var(--color-accent)',
}

export function ActivityFeed({ items }) {
  return (
    <div className="panel p-4 flex flex-col min-h-0">
      <h2 className="label mb-3">Live Activity</h2>
      <ul className="space-y-1.5 overflow-y-auto font-mono text-xs leading-relaxed" style={{ maxHeight: '420px' }}>
        {items.length === 0 && (
          <li style={{ color: 'var(--color-muted-foreground)' }}>waiting for events…</li>
        )}
        {items.map(e => (
          <li key={e.key} className="feed-in flex gap-2">
            <span style={{ color: 'var(--color-muted-foreground)' }}>
              {new Date(e.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span style={{ color: KIND_COLOR[e.data.kind] ?? 'var(--color-foreground)' }}>{e.data.msg}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
