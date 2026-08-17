// ChartCard: shell premium glassmorphic que envuelve gráficos con stats, filtros y tendencias.
import { type ReactNode } from 'react'

type Props = {
  title?: string
  subtitle?: string
  stats?: ReactNode
  actions?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export const ChartCard = ({ title, subtitle, stats, actions, children, footer }: Props) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/8 via-bg-elevated to-bg-elevated shadow-[0_4px_24px_-4px_rgba(217,179,132,0.12)]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent" />
      <div className="relative p-4">
        {(title || actions) && (
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="truncate text-sm font-bold tracking-wide text-fg">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </div>
        )}

        {stats && <div className="mb-3">{stats}</div>}

        <div className="relative">{children}</div>

        {footer && <div className="mt-3">{footer}</div>}
      </div>
    </div>
  )
}
