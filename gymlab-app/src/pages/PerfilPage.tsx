// Página /perfil: resumen de progreso, historial y rachas como composición de tarjetas finas.
// Los datos base (workouts/prs/racha) salen de la capa única de logros; las tarjetas
// reciben solo props y se autoocultan según los datos (mismo comportamiento que el original).
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { useSettings } from '@/hooks/useSettings'
import { useAchievementsData } from '@/hooks/useAchievementsData'
import { latestVariants } from '@/domain/achievements'
import { formatVolume } from '@/domain/volume'
import { weeklyVolume } from '@/domain/workouts'
import { formatUnits } from '@/domain/settings'
import { computeWeeklyVolumeInsight } from '@/domain/insights'

type PerfilTab = 'resumen' | 'historial' | 'rachas'

export const PerfilPage = () => {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const { exercises } = useExerciseCatalog()
  const [tab, setTab] = useState<PerfilTab>('resumen')
  // Mapa id→nombre para resolver los nombres de ejercicio de cada PR.
  const nameById = useMemo(() => new Map(exercises.map((e) => [e.id, e.name])), [exercises])
  // Mapa id→ejercicio para la comparativa (nombre + grupo muscular), sin recargar el catálogo.
  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])

  // Workouts, PRs y racha vienen de la capa única (F120/A5): antes useWorkoutSummary
  // y usePRs repetían ambos getAll y calcStreak. Los KPIs que no expone el proveedor
  // se derivan con las mismas funciones puras sobre el MISMO array.
  const {
    workouts,
    prs,
    streak,
    savedIds: unlockedAchievementIds,
    counts: achievementCounts,
    collectibles: achievementVariants,
  } = useAchievementsData()
  const currentStreak = streak.currentStreak
  const weeklyVolumeValue = useMemo(() => weeklyVolume(workouts), [workouts])
  const totalVolume = useMemo(() => workouts.reduce((acc, w) => acc + w.totalVolume, 0), [workouts])
  const totalPrs = prs.length
  const volumeInsight = useMemo(() => computeWeeklyVolumeInsight(workouts), [workouts])
  const chapaVariants = useMemo(() => latestVariants(achievementVariants), [achievementVariants])

  // KPIs del resumen (misma fuente que Estadísticas) sobre el hook único.
  const cards: SummaryCardSpec[] = [
    { icon: Flame, label: t('perfil.rachaActual'), value: currentStreak > 0 ? t('perfil.semanas', { count: currentStreak }) : '—', tone: 'cta' },
    { icon: TrendingUp, label: t('perfil.volumenSemanal'), value: weeklyVolumeValue > 0 ? formatVolume(weeklyVolumeValue) : '—', tone: 'success' },
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
          variants={chapaVariants}
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
            <HistorialTab
              prs={prs}
              nameById={nameById}
              workouts={workouts}
              units={settings.units}
              exerciseById={exerciseById}
            />
          ) : (
            <RachasSection streak={streak} workouts={workouts} />
          )}
        </TabNav>
      </div>
    </div>
  )
}