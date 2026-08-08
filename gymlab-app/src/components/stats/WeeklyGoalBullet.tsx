// Indicador del objetivo semanal: anillo de progreso con entrenos realizados y restantes.
import { ProgressRing } from '@/components/ui/ProgressRing'

type Props = {
  workoutsThisWeek: number
  weeklyGoal: number
}

// Muestra el % de avance (acotado a 100) y los entrenos que faltan para cumplir la meta.
export const WeeklyGoalBullet = ({ workoutsThisWeek, weeklyGoal }: Props) => {
  const pct = weeklyGoal > 0 ? Math.min(100, Math.round((workoutsThisWeek / weeklyGoal) * 100)) : 0
  const remaining = Math.max(0, weeklyGoal - workoutsThisWeek)

  return (
    <div className="flex items-center gap-4">
      <ProgressRing value={pct} size={72} stroke={6} label={`Objetivo semanal ${pct}%`} />
      <div>
        <p className="kicker">Objetivo semanal</p>
        <p className="stat-value text-2xl">
          {workoutsThisWeek}/{weeklyGoal} entrenos
        </p>
        <p className="text-xs text-muted">
          {workoutsThisWeek >= weeklyGoal
            ? 'Objetivo conseguido esta semana'
            : `${remaining} ${remaining === 1 ? 'entreno' : 'entrenos'} restantes`}
        </p>
      </div>
    </div>
  )
}
