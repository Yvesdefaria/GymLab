import { useLiveQuery } from 'dexie-react-hooks'
import { useLiveList } from '@/hooks/useLiveList'
import { useAchievementProgress } from '@/hooks/useAchievementProgress'
import { metaRepo, stepRepo } from '@/data/repositories'
import {
  UNLOCKED_ACHIEVEMENTS_KEY,
  ACHIEVEMENT_COUNTS_KEY,
} from '@/hooks/useAchievements'
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
  // Histórico completo de pasos para la galería de logros (F84f).
  const stepDays = useLiveList(() => stepRepo.getAll())
  // Progreso en vivo de las 15 barras (F95.3): stats reales desde Dexie.
  const { progress } = useAchievementProgress()

  return (
    <AchievementsPage
      unlockedIds={savedIds}
      counts={counts}
      stepDays={stepDays}
      progress={progress}
    />
  )
}