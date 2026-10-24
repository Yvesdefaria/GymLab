// Fila de grupo por objetivo del catálogo: acordeón de una sola apertura, con conteo.
import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

export const RoutineObjectiveGroup = ({
  label,
  count,
  open,
  onToggle,
  children,
}: {
  label: string
  count: number
  open: boolean
  onToggle: () => void
  children?: ReactNode
}) => {
  const panelId = useId()
  return (
    <div className="border-t border-border/40 first:border-t-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-11 w-full items-center gap-2.5 text-left"
      >
        <span className="size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
        <span className="text-xs font-medium text-fg">{label}</span>
        <span className="text-[10px] tabular-nums text-muted">{count}</span>
        <ChevronDown
          className={`ml-auto size-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div id={panelId} className="space-y-3 pb-3">
          {children}
        </div>
      ) : null}
    </div>
  )
}
