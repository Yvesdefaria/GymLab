// Héroe de una pestaña de Stats: eyebrow, número/palabra grande, unidad y delta.
// El delta de progreso va en gold; el verde queda reservado a meta/PR/cumplido.
import type { ReactNode } from 'react'

type DeltaTone = 'progress' | 'success' | 'muted'

type StatsHeroProps = {
  eyebrow: string
  value: string
  unit?: string
  delta?: string
  deltaTone?: DeltaTone
  valueClassName?: string
  children?: ReactNode
}

const deltaClass: Record<DeltaTone, string> = {
  progress: 'text-gold-bright',
  success: 'text-success',
  muted: 'text-muted',
}

export const StatsHero = ({
  eyebrow,
  value,
  unit,
  delta,
  deltaTone = 'progress',
  valueClassName = 'text-[52px]',
  children,
}: StatsHeroProps) => (
  <section className="border-b border-border/40 pb-4 pt-2">
    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
      {eyebrow}
    </p>
    <div className="mt-1 flex items-baseline gap-2">
      <strong
        className={`font-display font-light leading-none tabular-nums text-fg ${valueClassName}`}
      >
        {value}
      </strong>
      {unit ? <span className="text-sm text-muted">{unit}</span> : null}
    </div>
    {delta ? (
      <p className={`mt-1 text-[10px] font-semibold ${deltaClass[deltaTone]}`}>{delta}</p>
    ) : null}
    {children}
  </section>
)
