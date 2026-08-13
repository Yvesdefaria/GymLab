// Indicador del objetivo semanal: anillo de progreso con entrenos realizados y restantes.
import { useTranslation } from 'react-i18next'
import { ProgressRing } from '@/components/ui/ProgressRing'

type Props = {
  workoutsThisWeek: number
  weeklyGoal: number
}

// Muestra el % de avance (acotado a 100) y los entrenos que faltan para cumplir la meta.
export const WeeklyGoalBullet = ({ workoutsThisWeek, weeklyGoal }: Props) => {
  const { t } = useTranslation()
  const pct = weeklyGoal > 0 ? Math.min(100, Math.round((workoutsThisWeek / weeklyGoal) * 100)) : 0
  const remaining = Math.max(0, weeklyGoal - workoutsThisWeek)

  return (
    <div className="flex items-center gap-4">
      <ProgressRing value={pct} size={72} stroke={6} label={t('stats.objetivoAria', { pct })} />
      <div>
        <p className="kicker">{t('stats.objetivoSemanal')}</p>
        <p className="stat-value text-2xl">
          {t('stats.objetivoProgreso', { count: workoutsThisWeek, total: weeklyGoal })}
        </p>
        <p className="text-xs text-muted">
          {workoutsThisWeek >= weeklyGoal
            ? t('stats.objetivoConseguido')
            : t('stats.objetivoRestantes', { count: remaining })}
        </p>
      </div>
    </div>
  )
}
