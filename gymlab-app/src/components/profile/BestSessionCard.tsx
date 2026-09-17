// Tarjeta wrapper de la comparativa entre sesiones (requiere al menos 2 workouts).
import { SessionComparison } from '@/components/session/SessionComparison'
import type { Units } from '@/domain/settings'
import type { Exercise, PRRecord, Workout } from '@/domain/types'

export const BestSessionCard = ({
  workouts,
  prs,
  exerciseById,
  units,
}: {
  workouts: Workout[]
  prs: PRRecord[]
  exerciseById: ReadonlyMap<number, Exercise>
  units: Units
}) => {
  if (workouts.length < 2) return null
  return (
    <div className="panel-light rounded-2xl p-4">
      <SessionComparison
        workouts={workouts}
        prs={prs}
        exerciseById={exerciseById}
        units={units}
      />
    </div>
  )
}
