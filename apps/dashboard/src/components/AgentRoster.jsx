const STATUS_COLOR = {
  run: 'var(--color-success)',
  idle: 'var(--color-muted-foreground)',
  fail: 'var(--color-destructive)',
}

export function AgentRoster({ roster, onSelect }) {
  return (
    <div className="panel p-4">
      <h2 className="label mb-3">Agent Roster</h2>
      <ul className="space-y-1">
        {roster.map(a => (
          <li key={a.id}>
            <button
              onClick={() => onSelect?.(a.id)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left font-mono text-sm transition-colors duration-150 hover:bg-[color:var(--color-muted)]"
              title={a.role}
            >
              <span aria-hidden className="inline-block h-2 w-2 rounded-full"
                style={{
                  background: STATUS_COLOR[a.status] ?? STATUS_COLOR.idle,
                  boxShadow: a.status === 'run' ? '0 0 8px var(--color-success)' : 'none',
                }} />
              <span className="w-10 font-semibold" style={{ color: 'var(--color-foreground)' }}>{a.label}</span>
              {/* status as text too — never color alone */}
              <span style={{ color: 'var(--color-muted-foreground)' }}>{a.status}</span>
              {a.lastRunAt && (
                <span className="ml-auto text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                  {new Date(a.lastRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
        click an agent for details
      </p>
    </div>
  )
}
