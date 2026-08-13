// Página /estadisticas: panel de rendimiento (entrenos) y composición corporal.
// Solo orquesta datos de los hooks y delega el render en EntrenamientoStats / CuerpoStats.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, Dumbbell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { TabNav } from '@/components/ui/TabNav'
import { EntrenamientoStats } from '@/components/stats/EntrenamientoStats'
import { CuerpoStats } from '@/components/stats/CuerpoStats'
import { useWorkouts } from '@/hooks/useWorkouts'
import { useWorkoutSets } from '@/hooks/useWorkoutSets'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { useBodyWeight } from '@/hooks/useBodyWeight'
import { useBodyMeasurements } from '@/hooks/useBodyMeasurements'
import { useSkinfolds } from '@/hooks/useSkinfolds'
import { useStreak } from '@/hooks/useStreak'
import { useProfile } from '@/hooks/useProfile'
import { useMetaValue } from '@/hooks/useMetaValue'
import { BODY_SEX_KEY, HEIGHT_KEY } from '@/domain/profileMeta'
import type { Sex } from '@/domain/types'

type StatsTab = 'entreno' | 'cuerpo'

export const EstadisticasPage = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState<StatsTab>('entreno')
  const { workouts } = useWorkouts()
  const { sets } = useWorkoutSets()
  const { exercises } = useExerciseCatalog()
  const { entries: weightEntries } = useBodyWeight()
  const { entries: measurementEntries } = useBodyMeasurements()
  const { entries: skinfoldEntries } = useSkinfolds()
  const streak = useStreak()
  const profile = useProfile()
  const heightCm = useMetaValue<number>(HEIGHT_KEY, 0)
  const sex = useMetaValue<Sex>(BODY_SEX_KEY, 'male')

  // Mapa id→workout para resolver el nombre del entreno al que pertenece cada serie.
  const workoutsById = useMemo(() => new Map(workouts.map((w) => [w.id, w])), [workouts])
  const weeklyGoal = profile?.weeklyGoal ?? 3

  // Solo si existe cualquier registro se muestran los paneles; si no, estado vacío.
  const hasData =
    workouts.length > 0 ||
    weightEntries.length > 0 ||
    measurementEntries.length > 0 ||
    skinfoldEntries.length > 0

  return (
    <div>
      <AppHeader title={t('estadisticas.titulo')} subtitle={t('estadisticas.subtitulo')} />
      <div className="space-y-4 p-4">
        {hasData ? (
          <TabNav
            ariaLabel={t('estadisticas.seccionesAria')}
            tabs={[
              { id: 'entreno', label: t('estadisticas.tabEntreno') },
              { id: 'cuerpo', label: t('estadisticas.tabCuerpo') },
            ]}
            active={tab}
            onChange={(id) => setTab(id as StatsTab)}
          >
            {tab === 'entreno' ? (
              <EntrenamientoStats
                workouts={workouts}
                sets={sets}
                workoutsById={workoutsById}
                exercises={exercises}
                currentStreak={streak.currentStreak}
                weeklyGoal={weeklyGoal}
              />
            ) : (
              <CuerpoStats
                weightEntries={weightEntries}
                measurementEntries={measurementEntries}
                skinfoldEntries={skinfoldEntries}
                heightCm={heightCm}
                sex={sex}
              />
            )}
          </TabNav>
        ) : (
          <div className="rounded-2xl border border-dashed border-gold/40 bg-bg-elevated/50 p-8 text-center">
            <BarChart3 className="mx-auto mb-3 size-8 text-cta" aria-hidden />
            <p className="font-display text-base font-semibold text-fg">
              {t('estadisticas.sinDatosTitulo')}
            </p>
            <p className="mt-1 text-sm text-muted">
              {t('estadisticas.sinDatosTexto')}
            </p>
            <Link
              to="/"
              className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-cta px-5 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90"
            >
              <Dumbbell className="size-4" aria-hidden />
              {t('estadisticas.empezarEntrenar')}
            </Link>
          </div>
        )}

        <p className="text-center text-xs text-muted">
          {t('estadisticas.disclaimer')}
        </p>
      </div>
    </div>
  )
}
