import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAchievementProgress } from '@/hooks/useAchievementProgress'
import { metaRepo } from '@/data/repositories'
import {
  UNLOCKED_ACHIEVEMENTS_KEY,
  ACHIEVEMENT_COUNTS_KEY,
} from '@/hooks/useAchievements'
import { latestVariants } from '@/domain/achievements'
import { AchievementsPage } from './AchievementsPage'

export const AchievementsRoute = () => {
  const savedIds = useLiveQuery(
    () => metaRepo.getJson<string[]>(UNLOCKED_ACHIEVEMENTS_KEY, []),
    []
  ) ?? []
  const counts = useLiveQuery(
    () => metaRepo.getJson<Record<string, number>>(ACHIEVEMENT_COUNTS_KEY, {}),
    []
  ) ?? {}
  // Progreso en vivo de las 24 barras unificadas (F95.3, F109.1): stats reales
  // desde Dexie (los pasos entran vía useAchievementProgress).
  // collectibles trae las variantes de chapa concedidas (F95.1).
  const { progress, collectibles } = useAchievementProgress()

  // Variante vigente por logro (la última concedida), para la galería.
  const variants = useMemo(() => latestVariants(collectibles), [collectibles])

  return (
    <AchievementsPage
      unlockedIds={savedIds}
      counts={counts}
      progress={progress}
      variants={variants}
    />
  )
}