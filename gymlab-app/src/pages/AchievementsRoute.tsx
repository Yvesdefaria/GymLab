import { useLiveQuery } from 'dexie-react-hooks'
import { useLiveList } from '@/hooks/useLiveList'
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

  return <AchievementsPage unlockedIds={savedIds} counts={counts} stepDays={stepDays} />
}