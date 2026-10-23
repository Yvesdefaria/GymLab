// Bloque “Más datos” de Stats C1: colapsable, con una hairline y chevron.
// Conserva las secciones secundarias (bitácora, cardio, balance) sin competir
// con el stack principal.
import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

type StatsMoreDataProps = {
  title: string
  hint: string
  children: ReactNode
  defaultOpen?: boolean
}

export const StatsMoreData = ({
  title,
  hint,
  children,
  defaultOpen = false,
}: StatsMoreDataProps) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="border-t border-border/40 pt-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 py-1 text-left"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {title}
        </span>
        <span className="flex items-center gap-2 text-[10px] text-muted">
          {hint}
          <ChevronDown
            className={`size-4 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </span>
      </button>
      {open ? <div className="space-y-4 pt-2">{children}</div> : null}
    </section>
  )
}
