// Encabezado de sección del catálogo: eyebrow en mayúsculas + meta opcional a la derecha.
import type { ReactNode } from 'react'

export const RoutineSection = ({
  title,
  meta,
  children,
}: {
  title: string
  meta?: ReactNode
  children: ReactNode
}) => (
  <section className="border-t border-border/40 pt-4">
    <div className="mb-1 flex items-baseline justify-between gap-3">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{title}</h2>
      {meta ? <span className="text-[10px] tabular-nums text-muted">{meta}</span> : null}
    </div>
    {children}
  </section>
)
