// Variantes de chapa (recompensa cosmética, F95.1): concesión determinista e
// idempotente en función de los contadores «veces conseguido» (re-logros).
// Sin monedas ni tiradas aleatorias: mismos counts ⇒ mismo conjunto de
// variantes, así que recargar nunca dobla concesiones (unión idempotente en
// meta.collectibles). Re-exportado desde achievements.ts junto al resto del
// dominio de logros (cap de ~200 líneas del módulo principal).

export type Collectible = { achievementId: string; variantId: string }

// Secuencia fija de variantes por logro (≤ 3; vacío = solo la base). Los
// logros permanentes (guias-completas, primer-ano) no se pueden re-lograr en
// uso normal, así que su secuencia queda vacía y nunca conceden variantes.
export const ACHIEVEMENT_VARIANTS: Readonly<Record<string, string[]>> = {
  'primer-paso': ['polished', 'radiant', 'onyx'],
  inaugural: ['polished', 'radiant', 'onyx'],
  'racha-4': ['polished', 'radiant', 'onyx'],
  'racha-8': ['polished', 'radiant', 'onyx'],
  'primera-marca': ['polished', 'radiant', 'onyx'],
  'volumen-semanal': ['polished', 'radiant', 'onyx'],
  'sesiones-50': ['polished', 'radiant', 'onyx'],
  'consistencia-4s': ['polished', 'radiant', 'onyx'],
  'primera-cardio': ['polished', 'radiant', 'onyx'],
  'ejercicios-100': ['polished', 'radiant', 'onyx'],
  'racha-16': ['polished', 'radiant', 'onyx'],
  'pr-10kg': ['polished', 'radiant', 'onyx'],
  'sesiones-500': ['polished', 'radiant', 'onyx'],
  'guias-completas': [],
  'primer-ano': [],
}

// Concesión determinista: variantes = count − 1 primeras de la secuencia
// (count 1 ⇒ ninguna, 2 ⇒ índice 0, 3 ⇒ índices 0 y 1…), capado al final de
// la secuencia — agotada, no se concede nada más y no se eleva error.
export const grantedCollectibles = (counts: Record<string, number>): Collectible[] => {
  const collectibles: Collectible[] = []
  for (const [id, count] of Object.entries(counts)) {
    const variants = ACHIEVEMENT_VARIANTS[id]
    if (!variants || variants.length === 0 || count < 2) continue
    const granted = Math.min(count - 1, variants.length)
    for (let i = 0; i < granted; i++) {
      collectibles.push({ achievementId: id, variantId: variants[i] })
    }
  }
  return collectibles
}

// Unión idempotente: conserva el orden y descarta pares (achievementId,
// variantId) ya presentes, para que re-evaluar el mismo estado no añada nada.
export const mergeCollectibles = (prev: Collectible[], next: Collectible[]): Collectible[] => {
  const seen = new Set(prev.map((c) => `${c.achievementId}:${c.variantId}`))
  const merged = [...prev]
  for (const c of next) {
    const key = `${c.achievementId}:${c.variantId}`
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(c)
    }
  }
  return merged
}

// Variante vigente de un logro: la última concedida (el array se conserva en
// orden de concesión). undefined si no tiene ninguna.
export const latestCollectible = (collectibles: Collectible[], achievementId: string): Collectible | undefined => {
  for (let i = collectibles.length - 1; i >= 0; i--) {
    if (collectibles[i].achievementId === achievementId) return collectibles[i]
  }
  return undefined
}

// Variantes vigentes por logro (la última concedida de cada uno) como mapa
// id → variantId; cómodo para pintar galerías y chapas (perfil /logros).
export const latestVariants = (collectibles: Collectible[]): Record<string, string> => {
  const map: Record<string, string> = {}
  for (const id of new Set(collectibles.map((c) => c.achievementId))) {
    const latest = latestCollectible(collectibles, id)
    if (latest) map[id] = latest.variantId
  }
  return map
}