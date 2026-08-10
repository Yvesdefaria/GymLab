// Host global de logros: evalúa los logros desbloqueados y, si hay alguno
// nuevo, muestra el modal encima de cualquier página. Vive en AppShell.
import { AchievementModal } from './AchievementModal'
import { useAchievements } from '@/hooks/useAchievements'

export const AchievementsHost = () => {
  const { achievements, dismiss } = useAchievements()
  if (achievements.length === 0) return null
  return <AchievementModal achievements={achievements} onClose={dismiss} />
}
