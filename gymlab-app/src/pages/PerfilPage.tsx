// Página /perfil: resumen de progreso, historial y rachas como composición de tarjetas finas.
// Los hooks de dominio (useWorkoutSummary/useStreak/usePRs/...) viven aquí; las tarjetas
// reciben solo props y se autoocultan según los datos (mismo comportamiento que el original).
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { Flame, TrendingUp, Calendar, Trophy } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { TabNav } from '@/components/ui/TabNav'
import { BackLink } from '@/components/ui/BackLink'
import type { SummaryCardSpec } from '@/components/summary/SummaryCards'
import { RachasSection } from '@/components/profile/RachasSection'
import { ProfileUserCard } from '@/components/profile/ProfileUserCard'
import { DeloadCard } from '@/components/profile/DeloadCard'
import { ChapasSection } from '@/components/profile/ChapasSection'
import { ResumenTab } from '@/components/profile/ResumenTab'
import { HistorialTab } from '@/components/profile/HistorialTab'
import { useStreak } from '@/hooks/useStreak'
import { useWorkoutSummary } from '@/hooks/useWorkoutSummary'
import { usePRs } from '@/hooks/usePRs'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { useSettings } from '@/hooks/useSettings'
import { metaRepo } from '@/data/repositories'
import { UNLOCKED_ACHIEVEMENTS_KEY, ACHIEVEMENT_COUNTS_KEY } from '@/hooks/useAchievements'
import { formatVolume } from '@/domain/volume'
import { formatUnits } from '@/domain/settings'
import { computeWeeklyVolumeInsight } from '@/domain/insights'

type PerfilTab = 'resumen' | 'historial' | 'rachas'

export const PerfilPage = () => {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const summary = useWorkoutSummary()
  const { workouts, currentStreak, weeklyVolume, totalVolume, totalPrs } = summary
  const streak = useStreak()
  const { prs } = usePRs()
  const { exercises } = useExerciseCatalog()
  const [tab, setTab] = useState<PerfilTab>('resumen')
  // Mapa id→nombre para resolver los nombres de ejercicio de cada PR.
  const nameById = useMemo(() => new Map(exercises.map((e) => [e.id, e.name])), [exercises])
  const volumeInsight = useMemo(() => computeWeeklyVolumeInsight(workouts), [workouts])

  // Chapas: ids desbloqueados y contadores (meta), reactivos a cambios.
  const unlockedAchievementIds = useLiveQuery(
    () => metaRepo.getJson<string[]>(UNLOCKED_ACHIEVEMENTS_KEY, []),
    []
  ) ?? []
  const achievementCounts = useLiveQuery(
    () => metaRepo.getJson<Record<string, number>>(ACHIEVEMENT_COUNTS_KEY, {}),
    []
  ) ?? {}

  // KPIs del resumen (misma fuente que Estadísticas) sobre el hook único.
  const cards: SummaryCardSpec[] = [
    { icon: Flame, label: t('perfil.rachaActual'), value: currentStreak > 0 ? t('perfil.semanas', { count: currentStreak }) : '—', tone: 'cta' },
    { icon: TrendingUp, label: t('perfil.volumenSemanal'), value: weeklyVolume > 0 ? formatVolume(weeklyVolume) : '—', tone: 'success' },
    { icon: Calendar, label: t('perfil.totalEntreno'), value: totalVolume > 0 ? formatVolume(totalVolume) : '—', tone: 'accent' },
    { icon: Trophy, label: t('perfil.prs'), value: totalPrs > 0 ? String(totalPrs) : '—', tone: 'cta' },
  ]

  return (
    <div>
      <AppHeader title={t('perfil.titulo')} subtitle={t('perfil.subtitulo')} />
      <div className="overflow-hidden space-y-4 p-4">
        <BackLink to="/mas" />
        <ProfileUserCard workoutsCount={workouts.length} />
        <DeloadCard workouts={workouts} />
        <ChapasSection
          unlockedIds={unlockedAchievementIds}
          counts={achievementCounts}
        />

        <TabNav
          ariaLabel={t('perfil.seccionesAria')}
          tabs={[
            { id: 'resumen', label: t('perfil.tabResumen') },
            { id: 'historial', label: t('perfil.tabHistorial') },
            { id: 'rachas', label: t('perfil.tabRachas') },
          ]}
          active={tab}
          onChange={(id) => setTab(id as PerfilTab)}
        >
          {tab === 'resumen' ? (
            <ResumenTab
              workouts={workouts}
              volumeInsight={volumeInsight}
              cards={cards}
              volumeUnits={formatUnits(settings.units)}
            />
          ) : tab === 'historial' ? (
            <HistorialTab prs={prs} nameById={nameById} workouts={workouts} units={settings.units} />
          ) : (
            <RachasSection streak={streak} workouts={workouts} />
          )}
        </TabNav>
      </div>
    </div>
  )
}