// Estancamientos como filas hairline: si no hay alertas, el bloque no existe.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { detectPlateaus } from '@/domain/plateauDetector'
import type { WorkoutSet, Exercise } from '@/domain/types'

type PlateauAlertsProps = {
  sets: WorkoutSet[]
  exercises: Exercise[]
  setsByExercise?: Map<number, WorkoutSet[]>
}

export const PlateauAlerts = ({ sets, exercises, setsByExercise }: PlateauAlertsProps) => {
  const { t } = useTranslation()

  const alerts = useMemo(
    () => detectPlateaus(sets, exercises, undefined, setsByExercise),
    [sets, exercises, setsByExercise],
  )

  if (alerts.length === 0) return null

  return (
    <div className="mt-5 border-t border-border/40 pt-1">
      {alerts.map((alert) => (
        <div
          key={alert.exerciseId}
          className="flex items-start gap-3 border-t border-border/40 py-3 first:border-t-0"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-fg">{alert.exerciseName}</p>
            <p className="mt-0.5 text-[9.5px] text-muted">
              {t('plateau.stagnant', { weeks: alert.weeksStagnant })}
              {' · '}
              {t('plateau.e1rm', { current: alert.currentE1rm, previous: alert.previousE1rm })}
            </p>
          </div>
          <span className="shrink-0 text-[9px] text-muted">
            {alert.suggestion === 'volume'
              ? t('plateau.suggestVolume')
              : alert.suggestion === 'variant'
                ? t('plateau.suggestVariant')
                : t('plateau.suggestDeload')}
          </span>
        </div>
      ))}
    </div>
  )
}
