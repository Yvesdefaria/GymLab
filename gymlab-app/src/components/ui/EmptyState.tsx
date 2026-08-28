// Estado vacío reutilizable: contenedor punteado con icono/título/mensaje/acción opcionales.
// Unifica el patrón de "no hay datos / sin resultados" que antes se copiaba en cada página.
import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: ReactNode
  title?: string
  message?: string
  action?: ReactNode
  /** accent = borde dorado (p. ej. splash de sesión); default = borde neutro. */
  tone?: 'default' | 'accent'
  /** sm: form compacto inline · md: por defecto · lg: estados grandes. */
  size?: 'sm' | 'md' | 'lg'
  className?: string
  messageClassName?: string
}

const PADDING: Record<NonNullable<EmptyStateProps['size']>, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export const EmptyState = ({
  icon,
  title,
  message,
  action,
  tone = 'default',
  size = 'md',
  className = '',
  messageClassName = '',
}: EmptyStateProps) => {
  return (
    <div
      role="status"
      className={`rounded-2xl border border-dashed text-center ${
        tone === 'accent' ? 'border-gold/40 bg-bg-elevated/50' : 'border-border bg-bg-elevated/50'
      } ${PADDING[size]} ${className}`}
    >
      {icon && <div className="mb-2 flex justify-center text-muted">{icon}</div>}
      {title && <p className="font-display text-base font-semibold text-fg">{title}</p>}
      {message && (
        <p className={`mx-auto text-sm text-muted ${title ? 'mt-1' : ''} ${messageClassName}`}>
          {message}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}