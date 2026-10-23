// Cabecera fija superior de página con kicker, título, subtítulo y acciones opcionales, sticky sobre el contenido.
import { type ReactNode } from 'react'
import { useSeo } from '@/hooks/useSeo'

type AppHeaderProps = {
  title: string
  subtitle?: string
  kicker?: string
  actions?: ReactNode
}

// Encabezado de cada sección; actualiza también el título SEO de la pestaña.
export const AppHeader = ({ title, subtitle, kicker, actions }: AppHeaderProps) => {
  useSeo(title)

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md" style={{ height: 'var(--app-header-h)' }}>
      <div className="flex min-h-[3.5rem] items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {kicker ? (
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              {kicker}
            </p>
          ) : null}
          <h1 className="truncate font-display text-2xl font-bold tracking-wide text-fg">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 truncate text-sm text-muted">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  )
}
