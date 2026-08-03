import type { ReactNode } from 'react'
import { AppHeader } from '../layout/AppHeader'

type PagePlaceholderProps = {
  title: string
  subtitle?: string
  children?: ReactNode
}

export const PagePlaceholder = ({
  title,
  subtitle,
  children,
}: PagePlaceholderProps) => {
  return (
    <div>
      <AppHeader title={title} subtitle={subtitle} />
      <div className="space-y-4 p-4">
        {children ?? (
          <div className="rounded-2xl border border-border bg-bg-elevated p-6 text-center">
            <p className="text-sm text-muted">
              Contenido en construcción. Siguiente fase del plan.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
