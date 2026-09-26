import { COMMON_EXERCISE_SLUGS } from './catalog'
import type { Exercise } from './types'

const COMMON_INDEX = new Map(COMMON_EXERCISE_SLUGS.map((slug, index) => [slug, index]))

// Orden canónico del catálogo (F93 #18) y desempate alfabético; compartido por el
// generador y el ajuste por duración.
export const rankCandidates = (candidates: readonly Exercise[]): Exercise[] =>
  [...candidates].sort((a, b) => {
    const ai = COMMON_INDEX.get(a.slug) ?? Number.MAX_SAFE_INTEGER
    const bi = COMMON_INDEX.get(b.slug) ?? Number.MAX_SAFE_INTEGER
    return ai === bi ? a.slug.localeCompare(b.slug) : ai - bi
  })
