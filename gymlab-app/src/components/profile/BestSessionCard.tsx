// Wrapper de la comparativa entre sesiones: exige al menos 2 workouts.
// El shell (hairline) lo pone la sección del historial; la interna no se toca.
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
    <SessionComparison
      workouts={workouts}
      prs={prs}
      exerciseById={exerciseById}
      units={units}
    />
  )
}
