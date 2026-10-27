// Subpágina /perfil/historial: marcas completas, timeline por mes paginado y
// el comparador de sesiones al final con su interna intacta.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProfileSection } from '@/components/profile/ProfileSection'
import { ProfilePrRows } from '@/components/profile/ProfilePrRows'
import { ProfileWorkoutRows } from '@/components/profile/ProfileWorkoutRows'
import { BestSessionCard } from '@/components/profile/BestSessionCard'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { useSettings } from '@/hooks/useSettings'
import { useAchievementsData } from '@/hooks/useAchievementsData'
import { buildVolumeByWorkout } from '@/domain/volume'

const PAGE_SIZE = 10

export const PerfilHistorialPage = () => {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const { exercises } = useExerciseCatalog()
  const { workouts, prs, bestPrs, completedSets } = useAchievementsData()
  const [visible, setVisible] = useState(PAGE_SIZE)

  const nameById = useMemo(() => new Map(exercises.map((e) => [e.id, e.name])), [exercises])
  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])
  const volumes = useMemo(() => buildVolumeByWorkout(completedSets), [completedSets])
  const units = settings.units

  return (
    <div>
      <AppHeader kicker={t('perfil.historialKicker')} title={t('perfil.historialTitulo')} />
      <div className="overflow-hidden px-4 pb-10">
        <BackLink to="/perfil" label={t('perfil.titulo')} />

        {workouts.length === 0 ? (
          <EmptyState
            tone="accent"
            className="my-5"
            icon={<Flame className="size-6" aria-hidden />}
            title={t('perfil.sinDatosTitulo')}
            message={t('perfil.sinDatosTexto')}
            action={
              <Link
                to="/"
                className="inline-flex min-h-11 items-center rounded-xl bg-cta px-4 text-xs font-semibold text-on-gold"
              >
                {t('perfil.empezarEntrenar')}
              </Link>
            }
          />
        ) : (
          <>
            {bestPrs.length > 0 ? (
              <ProfileSection
                title={t('perfil.mejoresMarcas')}
                meta={t('perfil.marcasCount', { count: bestPrs.length })}
              >
                <ProfilePrRows
                  prs={bestPrs}
                  nameById={nameById}
                  exerciseById={exerciseById}
                  units={units}
                  limit={bestPrs.length}
                />
              </ProfileSection>
            ) : null}

            <ProfileSection title={t('perfil.entrenos')}>
              <ProfileWorkoutRows
                workouts={workouts}
                volumes={volumes}
                units={units}
                limit={visible}
                grouped
                showMore
                onMore={() => setVisible((count) => count + PAGE_SIZE)}
              />
            </ProfileSection>

            {/* La comparativa conserva su título e interna; acá solo cambia el shell.
                Con un solo entreno no hay nada que comparar: no dejamos el shell vacío. */}
            {workouts.length > 1 ? (
              <section className="border-t border-border/40 pt-4">
                <BestSessionCard
                  workouts={workouts}
                  prs={prs}
                  exerciseById={exerciseById}
                  units={units}
                />
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
