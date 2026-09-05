// Chip de filtro con estado activo reflejado en aria-pressed (usado en catálogo y guías).
import type { ReactNode } from 'react'

interface ChipProps {
  active: boolean
  onClick: () => void
  children: ReactNode
}

export const Chip = ({ active, onClick, children }: ChipProps) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition-colors ${
      active
        ? 'border-cta bg-cta/20 text-accent-soft'
        : 'border-border text-muted hover:border-cta hover:text-accent-soft'
    }`}
  >
    {children}
  </button>
)