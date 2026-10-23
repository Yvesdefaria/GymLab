// Anillo de progreso circular del contador de pasos (dirección C): trazo fino
// dorado, número en blanco y meta en muted. Es el único anillo de la página.
import { useTranslation } from 'react-i18next'
import type { AppLanguage } from '@/domain/onboarding'
import { clampPercent } from '@/domain/numberGuard'
import { formatStepNumber } from '@/lib/intl'

type StepCircularProgressProps = {
  steps: number
  goal: number
  size?: number
  stroke?: number
  className?: string
}

export const StepCircularProgress = ({
  steps,
  goal,
  size = 214,
  stroke = 5,
  className = '',
}: StepCircularProgressProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage

  // El anillo se recorta al 100%; el número central sí puede superar la meta.
  const safeGoal = goal > 0 ? goal : 1
  const pct = clampPercent(Math.round((steps / safeGoal) * 100))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={steps}
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-label={t('steps.ringAria', {
        count: formatStepNumber(steps, lang),
        goal: formatStepNumber(goal, lang),
      })}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border/60"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-cta)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-300 motion-reduce:transition-none"
        />
      </svg>
      <span className="absolute flex flex-col items-center gap-1">
        <span className="font-display text-6xl font-light leading-none tabular-nums text-fg">
          {formatStepNumber(steps, lang)}
        </span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
          {t('steps.ringGoal', { goal: formatStepNumber(goal, lang) })}
        </span>
      </span>
    </div>
  )
}
