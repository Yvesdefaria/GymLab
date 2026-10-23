// Fila de stats de Stats C1: 2 o 3 columnas con hairlines y un punto de color
// opcional (categoría de dato, no estado). El valor va en Oswald liviano.
type StatsStatItem = {
  value: string
  label: string
  color?: string
}

type StatsStatRowProps = {
  items: StatsStatItem[]
  columns?: 2 | 3
  className?: string
}

export const StatsStatRow = ({ items, columns = 3, className = '' }: StatsStatRowProps) => (
  <div
    className={`grid ${columns === 2 ? 'grid-cols-2' : 'grid-cols-3'} divide-x divide-border/40 border-t border-border/40 py-3 text-center ${className}`}
  >
    {items.map((item) => (
      <div key={item.label} className="px-2">
        <strong className="block font-display text-2xl font-light tabular-nums text-fg">
          {item.value}
        </strong>
        <span className="flex items-center justify-center gap-1.5 text-[8px] uppercase tracking-[0.12em] text-muted">
          {item.color ? (
            <i className={`size-1.5 rounded-full ${item.color}`} aria-hidden />
          ) : null}
          {item.label}
        </span>
      </div>
    ))}
  </div>
)
