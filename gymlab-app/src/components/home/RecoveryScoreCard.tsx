// Tarjeta de score de recuperación en Home: muestra el score 0-100 con color y desglose expandible.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Activity } from 'lucide-react'
import type { RecoveryScoreResult, RecoveryRating } from '@/domain/recoveryScore'

type Props = { data: RecoveryScoreResult }

const RATING_COLOR: Record<RecoveryRating, string> = {
  ready: 'text-success',
  maybe: 'text-warning',
  rest: 'text-danger',
}

const RATING_BG: Record<RecoveryRating, string> = {
  ready: 'border-success/30 bg-success/5',
  maybe: 'border-warning/30 bg-warning/5',
  rest: 'border-danger/30 bg-danger/5',
}

const RATING_STROKE: Record<RecoveryRating, string> = {
  ready: 'text-success',
  maybe: 'text-warning',
  rest: 'text-danger',
}

export const RecoveryScoreCard = ({ data }: Props) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const { score, classification, breakdown } = data

  const size = 56
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (score / 100) * c

  return (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className={`w-full rounded-2xl border p-4 text-left transition-colors ${RATING_BG[classification]}`}
    >
      <div className="flex items-center gap-3.5">
        {/* Anillo de score */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-border" />
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
              className={`${RATING_STROKE[classification]} transition-[stroke-dashoffset] duration-500`}
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center font-display text-base font-bold ${RATING_COLOR[classification]}`}>
            {score}
          </span>
        </div>

        {/* Texto */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Activity className={`size-4 ${RATING_COLOR[classification]}`} aria-hidden />
            <span className={`text-sm font-bold ${RATING_COLOR[classification]}`}>
              {t('home.recovery.title')}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {t(`home.recovery.classification.${classification}`)}
          </p>
        </div>

        {/* Chevron */}
        <span className={`shrink-0 text-lg text-muted transition-transform ${expanded ? 'rotate-90' : ''}`}>›</span>
      </div>

      {/* Desglose expandible */}
      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/30 pt-3 text-xs">
          <div className="text-muted">
            {t('home.recovery.lastWorkout')}{' '}
            <span className="font-semibold text-fg">
              {breakdown.daysSince > 0 ? t('home.recovery.daysAgo', { count: breakdown.daysSince }) : t('home.recovery.today')}
            </span>
          </div>
          <div className="text-muted">
            {t('home.recovery.sleep')}{' '}
            <span className={`font-semibold ${RATING_COLOR[classification]}`}>{breakdown.sleep}%</span>
          </div>
          <div className="text-muted">
            {t('home.recovery.soreness')}{' '}
            <span className={`font-semibold ${RATING_COLOR[classification]}`}>{breakdown.soreness}%</span>
          </div>
          <div className="text-muted">
            {t('home.recovery.streak')}{' '}
            <span className="font-semibold text-accent-soft">{breakdown.streak}%</span>
          </div>
        </div>
      )}
    </button>
  )
}
