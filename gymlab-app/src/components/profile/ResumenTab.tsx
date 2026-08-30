// Contenido del tab «Resumen» del perfil: empty state + KPIs + volumen + insight semanal.
// Los wrappers de tarjetas deciden su propio render según los datos ({workouts}).
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Flame, Dumbbell } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { SummaryCards, type SummaryCardSpec } from '@/components/summary/SummaryCards'
import { InsightCard } from '@/components/insights/InsightCard'
import { VolumeChartCard } from '@/components/profile/VolumeChartCard'
import type { WeeklyVolumeInsight } from '@/domain/insights'
import type { Workout } from '@/domain/types'

export const ResumenTab = ({
  workouts,
  volumeInsight,
  cards,
  volumeUnits,
}: {
  workouts: Workout[]
  volumeInsight: WeeklyVolumeInsight | null
  cards: SummaryCardSpec[]
  volumeUnits: string
}) => {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      {workouts.length === 0 && (
        <EmptyState
          tone="accent"
          icon={<Flame className="size-8 text-cta" aria-hidden />}
          title={t('perfil.sinDatosTitulo')}
          message={t('perfil.sinDatosTexto')}
          action={
            <Link
              to="/"
              className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-cta px-5 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90"
            >
              <Dumbbell className="size-4" aria-hidden />
              {t('perfil.empezarEntrenar')}
            </Link>
          }
        />
      )}
      <SummaryCards cards={cards} />
      <VolumeChartCard workouts={workouts} />
      {volumeInsight && <InsightCard insight={volumeInsight} units={volumeUnits} />}
    </div>
  )
}