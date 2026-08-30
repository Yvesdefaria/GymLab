// Contenido del tab «Historial» del perfil: PRs + timeline reciente + comparativa de sesiones.
// Cada tarjeta se autooculta según los datos disponibles (sin PRs/`<1`/`<2` workouts).
import { PrListCard } from '@/components/profile/PrListCard'
import { RecentHistoryCard } from '@/components/profile/RecentHistoryCard'
import { BestSessionCard } from '@/components/profile/BestSessionCard'
import type { Units } from '@/domain/settings'
import type { PRRecord, Workout } from '@/domain/types'

export const HistorialTab = ({
  prs,
  nameById,
  workouts,
  units,
}: {
  prs: PRRecord[]
  nameById: Map<number, string>
  workouts: Workout[]
  units: Units
}) => {
  return (
    <div className="space-y-4">
      <PrListCard prs={prs} nameById={nameById} units={units} />
      <RecentHistoryCard workouts={workouts} units={units} />
      <BestSessionCard workouts={workouts} />
    </div>
  )
}