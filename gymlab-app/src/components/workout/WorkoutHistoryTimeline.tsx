// Línea de tiempo del historial de sesiones: lista paginable de entrenamientos con fecha, volumen y duración.
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Workout } from '@/domain/types'
import type { Units } from '@/domain/settings'
import { applyUnits, formatUnits } from '@/domain/settings'
import { localDateOf } from '@/domain/dates'
import { workoutDurationMin } from '@/domain/workouts'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'

type WorkoutHistoryTimelineProps = {
  workouts: Workout[]
  units: Units
  max?: number
  startFrom?: number
}

export const WorkoutHistoryTimeline = ({
  workouts,
  units,
  max = 10,
  startFrom = 0,
}: WorkoutHistoryTimelineProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  // Ventana de la lista (pagínación por `startFrom` y `max`).
  const items = workouts.slice(startFrom, startFrom + max)
  return (
    <div className="relative">
      <div className="absolute bottom-3 left-[5px] top-3 w-px bg-border" aria-hidden />
      <div>
        {items.map((w) => {
          const start = new Date(w.startedAt)
          const durMin = workoutDurationMin(w)
          const date = new Date(localDateOf(w) + 'T12:00:00')
          return (
            <Link
              key={w.id}
              to={`/entrenamiento/${w.id}`}
              className="relative flex items-start gap-3 pb-3 pl-5"
            >
              <span
                className="absolute left-0 top-1.5 size-[11px] rounded-full border-2 border-cta bg-bg-elevated"
                aria-hidden
              />
              <span className="flex-1 rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2 transition-colors hover:bg-bg-elevated/50">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-fg">
                    {formatDate(date, lang, { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDate(start, lang, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {Math.round(applyUnits(w.totalVolume, units)).toLocaleString()} {formatUnits(units)}
                  {durMin !== null ? t('workout.minSufijo', { min: durMin }) : ''}
                </span>
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
