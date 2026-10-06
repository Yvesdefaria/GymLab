import { useMemo } from 'react'
import { useAchievementProgress } from '@/hooks/useAchievementProgress'
import { latestVariants } from '@/domain/achievements'
import { AchievementsPage } from './AchievementsPage'

// Galería de logros: consume la capa única de datos (progreso y meta ya
// compartidos con el host global) para no repetir el scan de series completadas.
export const AchievementsRoute = () => {
  const { savedIds, counts, progress, collectibles } = useAchievementProgress()

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
