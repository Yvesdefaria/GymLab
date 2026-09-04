// Host global de logros: evalúa los logros desbloqueados y, si hay alguno
// nuevo, muestra el modal encima de cualquier página. Vive en AppShell.
import { lazy, Suspense } from 'react'
import { useAchievements } from '@/hooks/useAchievements'

const AchievementModal = lazy(() =>
  import('./AchievementModal').then((m) => ({ default: m.AchievementModal }))
)

export const AchievementsHost = () => {
  const { achievements, dismiss } = useAchievements()
  if (achievements.length === 0) return null
  return (
    <Suspense fallback={null}>
      <AchievementModal achievements={achievements} onClose={dismiss} />
    </Suspense>
  )
}
