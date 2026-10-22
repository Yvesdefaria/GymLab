// Host global de logros: evalúa los logros desbloqueados y, si hay alguno
// nuevo, muestra el modal encima de cualquier página. Vive en AppShell.
import { lazy, Suspense } from 'react'
import { useAchievements } from '@/hooks/useAchievements'
import { useTourStore } from '@/store/tourStore'

const AchievementModal = lazy(() =>
  import('./AchievementModal').then((m) => ({ default: m.AchievementModal }))
)

export const AchievementsHost = () => {
  const { achievements, dismiss, counts, newGranted } = useAchievements()
  // F127: el tour de primer arranque manda. Si un logro salta con el tour abierto
  // (p. ej. `cuerpo-primer-peso` al cerrar el wizard), la cola queda retenida en
  // el hook y se celebra al cerrarlo: dos `aria-modal` a la vez se roban el foco
  // y el velo del logro oscurece justo lo que el tour está señalando.
  const tourOpen = useTourStore((s) => s.source !== null)
  if (achievements.length === 0 || tourOpen) return null
  return (
    <Suspense fallback={null}>
      <AchievementModal
        achievements={achievements}
        onClose={dismiss}
        counts={counts}
        newGranted={newGranted}
      />
    </Suspense>
  )
}
