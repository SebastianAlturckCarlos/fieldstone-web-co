export function KpiTile({ label, value, sub, accent }) {
  return (
    <div className="panel px-4 py-3">
      <div className="label text-[10px]">{label}</div>
      <div className="font-mono text-2xl font-semibold mt-1"
        style={{ color: accent ? 'var(--color-accent)' : 'var(--color-foreground)' }}>
        {value}
      </div>
      {sub && (
        <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
          {sub}
        </div>
      )}
    </div>
  )
}
