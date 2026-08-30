// Tarjeta wrapper de la comparativa entre sesiones (requiere al menos 2 workouts).
import { SessionComparison } from '@/components/session/SessionComparison'
import type { Workout } from '@/domain/types'

export const BestSessionCard = ({ workouts }: { workouts: Workout[] }) => {
  if (workouts.length < 2) return null
  return (
    <div className="panel-light rounded-2xl p-4">
      <SessionComparison workouts={workouts} />
    </div>
  )
}