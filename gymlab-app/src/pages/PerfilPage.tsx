// Página /perfil (Nocturno Minimal, dirección A): identidad + héroe de racha,
// secciones hairline y un único empty state honesto cuando no hay entrenos.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatsStatRow } from '@/components/stats/StatsStatRow'
import { ProfileUserCard } from '@/components/profile/ProfileUserCard'
import { ProfileStreakHero } from '@/components/profile/ProfileStreakHero'
import { ProfileSection } from '@/components/profile/ProfileSection'
import { ProfilePrRows } from '@/components/profile/ProfilePrRows'
import { ProfileWorkoutRows } from '@/components/profile/ProfileWorkoutRows'
import { ProfileDataRows } from '@/components/profile/ProfileDataRows'
import { ProfileDeloadRow } from '@/components/profile/ProfileDeloadRow'
import { ProfileChapasRow } from '@/components/profile/ProfileChapasRow'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { useSettings } from '@/hooks/useSettings'
import { useAchievementsData } from '@/hooks/useAchievementsData'
import { useBodyProfile } from '@/hooks/useBodyProfile'
import { latestVariants } from '@/domain/achievements'
import { applyUnits, formatUnits } from '@/domain/settings'
import { weeklyVolume } from '@/domain/workouts'
import { buildVolumeByWorkout } from '@/domain/volume'
import { firstWorkoutDate, profileSections } from '@/domain/profile'
import { formatNumber } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'

export const PerfilPage = () => {
  const { t, i18n } = useTranslation()
  const { settings } = useSettings()
  const { exercises } = useExerciseCatalog()

  // Workouts, PRs, racha y chapas vienen de la capa única de logros.
  const {
    workouts,
    bestPrs,
    completedSets,
    streak,
    savedIds: unlockedAchievementIds,
    counts: achievementCounts,
    collectibles: achievementVariants,
    bodyWeights,
  } = useAchievementsData()
  const { age, bodySex, heightCm, weightKg } = useBodyProfile(bodyWeights)

  const nameById = useMemo(() => new Map(exercises.map((e) => [e.id, e.name])), [exercises])
  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])
  const chapaVariants = useMemo(() => latestVariants(achievementVariants), [achievementVariants])
  const volumes = useMemo(() => buildVolumeByWorkout(completedSets), [completedSets])
  const weeklyVolumeValue = useMemo(
    () => weeklyVolume(workouts, volumes),
    [workouts, volumes]
  )
  const firstDate = useMemo(() => firstWorkoutDate(workouts), [workouts])

  const sections = profileSections({
    workoutsCount: workouts.length,
    prsCount: bestPrs.length,
    chapasCount: unlockedAchievementIds.length,
  })
  const hasPersonalData =
    age != null || heightCm != null || bodySex != null || weightKg != null

  const lang = i18n.language as AppLanguage
  const { units } = settings
  const stats = [
    {
      value: `${formatNumber(Math.round(applyUnits(weeklyVolumeValue, units)), lang)} ${formatUnits(units)}`,
      label: t('perfil.volumenSemanal'),
    },
    { value: String(bestPrs.length), label: t('perfil.prs') },
    { value: String(workouts.length), label: t('perfil.entrenos') },
  ]

  const dataSection = hasPersonalData ? (
    <ProfileSection title={t('perfil.datosPersonales')}>
      <ProfileDataRows
        age={age}
        heightCm={heightCm}
        bodySex={bodySex}
        weightKg={weightKg}
        units={units}
      />
    </ProfileSection>
  ) : null

  return (
    <div>
      <AppHeader kicker={t('perfil.kicker')} title={t('perfil.titulo')} />
      <div className="overflow-hidden px-4 pb-10">
        <BackLink to="/mas" label={t('layout.tab.mas')} />
        <ProfileUserCard workoutsCount={workouts.length} sinceDate={firstDate} />

        {sections.hero ? (
          <>
            <ProfileStreakHero streak={streak} workouts={workouts} />
            <StatsStatRow items={stats} />

            {sections.prs ? (
              <ProfileSection
                title={t('perfil.mejoresMarcas')}
                action={{ label: t('perfil.verTodasMarcas'), to: '/perfil/historial' }}
              >
                <ProfilePrRows
                  prs={bestPrs}
                  nameById={nameById}
                  exerciseById={exerciseById}
                  units={units}
                  limit={3}
                />
              </ProfileSection>
            ) : null}

            {sections.history ? (
              <ProfileSection
                title={t('perfil.historialReciente')}
                action={{ label: t('perfil.verTodoHistorial'), to: '/perfil/historial' }}
              >
                <ProfileWorkoutRows workouts={workouts} volumes={volumes} units={units} limit={3} />
              </ProfileSection>
            ) : null}

            {dataSection}

            <ProfileDeloadRow workouts={workouts} />

            {sections.chapas ? (
              <ProfileSection
                title={t('perfil.chapas')}
                action={{ label: t('perfil.chapasVerTodas'), to: '/logros' }}
              >
                <ProfileChapasRow
                  unlockedIds={unlockedAchievementIds}
                  counts={achievementCounts}
                  variants={chapaVariants}
                />
              </ProfileSection>
            ) : null}
          </>
        ) : (
          <>
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
            {dataSection}
          </>
        )}
      </div>
    </div>
  )
}
