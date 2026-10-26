// Sección hairline de una calculadora: título eyebrow, meta opcional y contenido.
import type { ReactNode } from 'react'

export const CalculatorSection = ({
  title,
  meta,
  children,
  className = '',
}: {
  title: string
  meta?: ReactNode
  children: ReactNode
  className?: string
}) => (
  <section className={`border-t border-border/40 pt-4 ${className}`}>
    <div className="flex items-baseline justify-between gap-2 pb-2">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{title}</h2>
      {meta ? <span className="text-[9.5px] tabular-nums text-muted">{meta}</span> : null}
    </div>
    {children}
  </section>
)
