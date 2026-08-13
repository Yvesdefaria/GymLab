// Anillo de progreso SVG circular que refleja un porcentaje (0-100).
import { useTranslation } from 'react-i18next'

type ProgressRingProps = {
  value: number
  size?: number
  stroke?: number
  label?: string
  className?: string
}

// Anillo de progreso accesible (role="progressbar") para mostrar avance de series, tiempo, etc.
export const ProgressRing = ({
  value,
  size = 88,
  stroke = 8,
  label,
  className = '',
}: ProgressRingProps) => {
  const { t } = useTranslation()
  const pct = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  // La circunferencia y su offset permiten "recortar" el trazo con strokeDasharray/offset.
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? t('layout.progress.label', { pct })}
    >
      <svg width={size} height={size} className="-rotate-90">
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
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-cta transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      <span className="absolute font-display text-lg font-bold text-accent">{pct}%</span>
    </div>
  )
}
