// Sección de gráfica de /pasos sin tarjeta: eyebrow + meta, valor grande,
// gráfico y footer opcional, separada por una hairline.
import type { ReactNode } from 'react'

type StepChartSectionProps = {
  title: string
  meta?: string
  value?: string
  valueLabel?: string
  children: ReactNode
  footer?: ReactNode
}

export const StepChartSection = ({
  title,
  meta,
  value,
  valueLabel,
  children,
  footer,
}: StepChartSectionProps) => (
  <section className="space-y-2 border-t border-border/40 pt-4">
    <div className="flex items-baseline justify-between gap-2">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        {title}
      </h2>
      {meta ? (
        <span className="shrink-0 text-right text-[10px] tabular-nums text-muted">{meta}</span>
      ) : null}
    </div>
    {value || valueLabel ? (
      <div className="flex items-baseline gap-2">
        {value ? (
          <strong className="font-display text-2xl font-light tabular-nums text-fg">
            {value}
          </strong>
        ) : null}
        {valueLabel ? <span className="text-[10px] text-muted">{valueLabel}</span> : null}
      </div>
    ) : null}
    {children}
    {footer}
  </section>
)
