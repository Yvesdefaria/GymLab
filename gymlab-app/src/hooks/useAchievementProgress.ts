// Facade de /logros sobre la capa única de datos: sin consultas ni derivación
// propias (stats/progreso vienen del proveedor montado en AppShell).
import type { AchievementProgress } from '@/domain/achievementProgress'
import { type Collectible } from '@/domain/achievements'
import { useAchievementsData } from './useAchievementsData'

export const useAchievementProgress = (): {
  progress: Record<string, AchievementProgress>
  /** Variantes de chapa concedidas (F95.1), en orden de concesión. */
  collectibles: Collectible[]
  /** Ids desbloqueados y contador «veces conseguido» (meta), para la galería. */
  savedIds: string[]
  counts: Record<string, number>
} => {
  const { progress, collectibles, savedIds, counts } = useAchievementsData()
  return { progress, collectibles, savedIds, counts }
}
