// Reconciliación de logros (F112, D6/D7): función pura que ajusta el estado
// persistido a los logros realmente sostenidos por los datos actuales. Se aplica
// en la evaluación de useAchievements para CUALQUIER pérdida de datos (borrado
// manual de un entreno, import, reset), no solo al borrar (D6).
//
// Fidelidad a la spec §5.2: `unlocked := unlocked ∩ earned` es el RECORTE; el alta
// de los recién ganados (que no están en savedIds) la une el hook antes de
// persistir. El estado persistido resultante es exactamente earnedIds.
import { grantedCollectibles, type Collectible } from './achievementCollectibles'

// Estado persistido de logros: espejo de las 4 claves de meta que usa el hook.
export interface AchievementState {
  unlocked: string[]
  counts: Record<string, number>
  snapshot: string[]
  collectibles: Collectible[]
}

// Re-bloqueo: un id persistido que ya no se sostiene sale de unlocked.
// Contadores: un re-bloqueo pierde su contador (queda fresco para un futuro re-logro).
// Snapshot: pasa a ser earnedIds, para que la próxima transición no-cumplido →
// cumplido vuelva a contar ×1 (D7).
// Chapas: retroceso determinístico (grantedCollectibles recomputado; en este camino
// reemplaza al merge append-only de F95.1).
export const reconcileAchievementState = (
  state: AchievementState,
  earnedIds: readonly string[],
): AchievementState => {
  const earned = new Set(earnedIds)
  const counts: Record<string, number> = {}
  for (const [id, count] of Object.entries(state.counts)) {
    if (earned.has(id)) counts[id] = count
  }
  return {
    unlocked: state.unlocked.filter((id) => earned.has(id)),
    counts,
    snapshot: [...earnedIds],
    collectibles: grantedCollectibles(counts),
  }
}

// Ids que se anuncian con modal: los ganados en ESTA evaluación que no estaban
// persistidos ANTES (savedIds pre-reconciliación). Re-bloquear no anuncia nada;
// volver a ganarlo más adelante sí (es un logro nuevo, D7).
export const freshAchievementIds = (
  earnedIds: readonly string[],
  savedIds: readonly string[],
): string[] => {
  const saved = new Set(savedIds)
  return earnedIds.filter((id) => !saved.has(id))
}

const collectibleKey = (c: Collectible): string => `${c.achievementId}:${c.variantId}`

// Variantes nuevas de esta evaluación: las del conjunto recomputado que no existían
// antes. Con retroceso + re-logro, la variante vuelve a anunciarse (D7); con el
// conjunto sin cambios, el delta es vacío (sin flood de anuncios).
export const newCollectibleDelta = (
  prev: readonly Collectible[],
  next: readonly Collectible[],
): Collectible[] => {
  const seen = new Set(prev.map(collectibleKey))
  return next.filter((c) => !seen.has(collectibleKey(c)))
}

// Escrituras solo-si-cambió: cada clave presente en el patch cambió respecto del
// estado previo. Estado idéntico ⇒ patch vacío (idempotencia, sin loops).
export interface AchievementStatePatch {
  unlocked?: string[]
  counts?: Record<string, number>
  snapshot?: string[]
  collectibles?: Collectible[]
}

const sameStringList = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index])

const sameCounts = (
  a: Readonly<Record<string, number>>,
  b: Readonly<Record<string, number>>,
): boolean => {
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
}

export const achievementStatePatch = (
  prev: AchievementState,
  next: AchievementState,
): AchievementStatePatch => {
  const patch: AchievementStatePatch = {}
  if (!sameStringList(prev.unlocked, next.unlocked)) patch.unlocked = next.unlocked
  if (!sameCounts(prev.counts, next.counts)) patch.counts = next.counts
  if (!sameStringList(prev.snapshot, next.snapshot)) patch.snapshot = next.snapshot
  if (!sameStringList(prev.collectibles.map(collectibleKey), next.collectibles.map(collectibleKey))) {
    patch.collectibles = next.collectibles
  }
  return patch
}
