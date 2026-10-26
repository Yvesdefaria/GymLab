// Resultado héroe de una calculadora: eyebrow, número Oswald liviano, unidad y clasificación.
// El dorado es el acento de la pantalla; el verde queda para una meta/logro real.
import type { ReactNode } from 'react'

type Tone = 'default' | 'success' | 'danger' | 'gold'

const toneClass: Record<Tone, string> = {
  default: 'text-fg',
  success: 'text-success',
  danger: 'text-danger',
  gold: 'text-gold-bright',
}

export const CalculatorResult = ({
  eyebrow,
  value,
  unit,
  label,
  note,
  tone = 'default',
  children,
  testId,
}: {
  eyebrow: string
  value: ReactNode
  unit?: string
  label?: string
  note?: string
  tone?: Tone
  children?: ReactNode
  testId?: string
}) => (
  <section data-testid={testId} className="border-b border-border/40 pb-4 pt-1">
    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">{eyebrow}</p>
    <div className="mt-1 flex items-baseline gap-1.5">
      <strong className="font-display text-[56px] font-light leading-none tabular-nums text-fg">
        {value}
      </strong>
      {unit ? <span className="text-sm text-muted">{unit}</span> : null}
    </div>
    {label ? <p className={`mt-1 text-xs font-semibold ${toneClass[tone]}`}>{label}</p> : null}
    {note ? <p className="mt-1 text-[10.5px] leading-relaxed text-muted">{note}</p> : null}
    {children}
  </section>
)
