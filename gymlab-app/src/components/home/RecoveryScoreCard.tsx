// Recuperación en la home: fila hairline con score, clasificación y desglose expandible.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InfoTip } from '@/components/ui/InfoTip'
import {
  RECOVERY_MAYBE_MIN,
  RECOVERY_READY_MIN,
  type RecoveryRating,
  type RecoveryScoreResult,
} from '@/domain/recoveryScore'

type Props = {
  data: RecoveryScoreResult
  daysSinceLastWorkout: number | null
}

const RATING_COLOR: Record<RecoveryRating, string> = {
  ready: 'text-success',
  maybe: 'text-warning',
  rest: 'text-danger',
}

const RATING_STROKE: Record<RecoveryRating, string> = {
  ready: 'text-success',
  maybe: 'text-warning',
  rest: 'text-danger',
}

export const RecoveryScoreCard = ({ data, daysSinceLastWorkout }: Props) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const { score, classification, breakdown } = data

  const size = 52
  const stroke = 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (score / 100) * c

  return (
    <section className="relative mt-5 border-t border-border/40 pt-3.5">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full text-left"
      >
        <div className="flex items-center gap-3.5 pr-7">
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
            <span className={`absolute inset-0 flex items-center justify-center font-display text-sm font-light ${RATING_COLOR[classification]}`}>
              {score}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className={`font-display text-[15px] ${RATING_COLOR[classification]}`}>
              {t(`home.recovery.classification.${classification}`)}
            </p>
            {daysSinceLastWorkout !== null && (
              <p className="mt-0.5 text-[9.5px] text-muted">
                {t('home.recovery.lastWorkout')}{' '}
                {daysSinceLastWorkout > 0
                  ? t('home.recovery.daysAgo', { count: daysSinceLastWorkout })
                  : t('home.recovery.today')}
              </p>
            )}
          </div>

          <span
            className={`shrink-0 text-muted transition-transform ${expanded ? 'rotate-90' : ''}`}
            aria-hidden="true"
          >
            ›
          </span>
        </div>

        {expanded && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/40 pt-3 text-[10px]">
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
              <span className="font-semibold text-gold-bright">{breakdown.streak}%</span>
            </div>
          </div>
        )}
      </button>

      <div className="absolute right-0 top-0">
        <InfoTip
          id="recovery"
          values={{
            restMax: RECOVERY_MAYBE_MIN - 1,
            maybeMin: RECOVERY_MAYBE_MIN,
            maybeMax: RECOVERY_READY_MIN - 1,
            readyMin: RECOVERY_READY_MIN,
          }}
        />
      </div>
    </section>
  )
}
