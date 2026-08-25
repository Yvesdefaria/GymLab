import { useLiveQuery } from 'dexie-react-hooks'
import { metaRepo } from '@/data/repositories'
import { UNLOCKED_ACHIEVEMENTS_KEY } from '@/hooks/useAchievements'
import { AchievementsPage } from './AchievementsPage'

export const AchievementsRoute = () => {
  const savedIds = useLiveQuery(
    () => metaRepo.getJson<string[]>(UNLOCKED_ACHIEVEMENTS_KEY, []),
    []
  ) ?? []

  return <AchievementsPage unlockedIds={savedIds} />
}
