// Sección de Stats C1 para contenido que no es un ChartCard: eyebrow + meta y
// una hairline superior, sin tarjeta.
import type { ReactNode } from 'react'
import { InfoTip } from '@/components/ui/InfoTip'
import type { HelpId, HelpValues } from '@/i18n/help'

type StatsSectionProps = {
  title: string
  meta?: string
  help?: HelpId
  helpValues?: HelpValues
  children: ReactNode
  footer?: ReactNode
}

export const StatsSection = ({ title, meta, help, helpValues, children, footer }: StatsSectionProps) => (
  <section className="border-t border-border/40 pt-4">
    <div className="flex items-baseline justify-between gap-2 pb-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <h2 className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {title}
        </h2>
        {help ? <InfoTip id={help} values={helpValues} /> : null}
      </div>
      {meta ? <span className="shrink-0 text-right text-[10px] text-muted">{meta}</span> : null}
    </div>
    {children}
    {footer ? <div className="mt-2">{footer}</div> : null}
  </section>
)
