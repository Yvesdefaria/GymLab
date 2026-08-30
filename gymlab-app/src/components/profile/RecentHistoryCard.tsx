// Tarjeta wrapper del historial reciente (workouts en timeline; no renderiza sin workouts).
import { useTranslation } from 'react-i18next'
import { WorkoutHistoryTimeline } from '@/components/workout/WorkoutHistoryTimeline'
import type { Units } from '@/domain/settings'
import type { Workout } from '@/domain/types'

export const RecentHistoryCard = ({
  workouts,
  units,
}: {
  workouts: Workout[]
  units: Units
}) => {
  const { t } = useTranslation()
  if (workouts.length === 0) return null
  return (
    <div className="panel-light rounded-2xl p-4">
      <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
        {t('perfil.historialReciente')}
      </h2>
      <WorkoutHistoryTimeline workouts={workouts} units={units} />
    </div>
  )
}