// Orden editorial de las guías: categorías canónicas y destacada = primera del primer grupo.
// El orden dentro de cada categoría es el del repositorio (seed), no alfabético.
import type { Guide, GuideCategory } from '@/domain/types'

export const GUIDE_CATEGORY_ORDER: GuideCategory[] = [
  'entrenamiento',
  'nutricion',
  'dietas',
  'suplementos',
  'mujer',
  'recuperacion',
  'leyenda',
]

const categoryRank = (category: GuideCategory): number => {
  const index = GUIDE_CATEGORY_ORDER.indexOf(category)
  return index === -1 ? GUIDE_CATEGORY_ORDER.length : index
}

// Ordena por categoría canónica y conserva el orden original dentro de cada una.
export const orderGuidesByCategory = (guides: Guide[]): Guide[] =>
  guides
    .map((guide, index) => ({ guide, index }))
    .sort((a, b) => categoryRank(a.guide.category) - categoryRank(b.guide.category) || a.index - b.index)
    .map(({ guide }) => guide)

// Separa la guía destacada (la primera del índice) del resto de la lista numerada.
export const splitGuides = (guides: Guide[]): { featured?: Guide; rest: Guide[] } => {
  const ordered = orderGuidesByCategory(guides)
  return { featured: ordered[0], rest: ordered.slice(1) }
}
