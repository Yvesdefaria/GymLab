// Anillo de progreso circular del contador de pasos: avance hacia la meta diaria
// con el número de pasos centrado. Variante de ProgressRing con gradiente propio
// (useId sanitizado evita colisiones de ids SVG) y anuncio del valor y la meta
// concretos, no solo del porcentaje.
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppLanguage } from '@/domain/onboarding'
import { clampPercent } from '@/domain/numberGuard'
import { formatNumber } from '@/lib/intl'

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
  size = 196,
  stroke = 14,
  className = '',
}: StepCircularProgressProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  // useId produce ':' que rompen url(#...); se eliminan para el id del gradiente.
  const gradId = useId().replace(/:/g, '')

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
      aria-label={t('steps.ringAria', { count: steps, goal })}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-cta)" />
            <stop
              offset="100%"
              stopColor="color-mix(in srgb, var(--color-cta), white 25%)"
            />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-300 motion-reduce:transition-none"
        />
      </svg>
      <span className="absolute flex flex-col items-center gap-0.5">
        <span className="font-display text-3xl font-bold leading-none text-accent">
          {formatNumber(steps, lang)}
        </span>
        <span className="text-xs font-medium text-muted">
          {t('steps.ringGoal', { goal: formatNumber(goal, lang) })}
        </span>
      </span>
    </div>
  )
}