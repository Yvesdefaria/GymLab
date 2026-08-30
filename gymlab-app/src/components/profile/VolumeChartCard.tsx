// Tarjeta wrapper del gráfico de volumen semanal (no renderiza sin workouts).
import { useTranslation } from 'react-i18next'
import { VolumeChart } from '@/components/profile/VolumeChart'
import type { Workout } from '@/domain/types'

export const VolumeChartCard = ({ workouts }: { workouts: Workout[] }) => {
  const { t } = useTranslation()
  if (workouts.length < 1) return null
  return (
    <div className="panel-light rounded-2xl p-4">
      <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
        {t('perfil.volumenPorSemana')}
      </h2>
      <VolumeChart workouts={workouts} />
    </div>
  )
}