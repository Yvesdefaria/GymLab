// Utilidades de dominio para rutinas (los labels de objetivo/nivel viven en domain/catalog.ts).

// Rangos válidos [min, max] de los objetivos por serie en el builder de rutinas.
export const TARGET_BOUNDS: Record<'targetSets' | 'targetReps' | 'restSec', [number, number]> = {
  targetSets: [1, 99],
  targetReps: [1, 100],
  restSec: [1, 600],
}

export const slugify = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

// Reordena un array: mueve el elemento en `fromIndex` a `toIndex`.
export const reorderArray = <T>(arr: T[], fromIndex: number, toIndex: number): T[] => {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return arr
  const next = [...arr]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

// Ítem de ejercicio en el borrador del builder (estado en memoria + datos guardados).
export interface RoutineDraftItem {
  exerciseId: number
  exerciseName: string
  targetSets: number
  targetReps: number
  restSec: number
  supersetGroup?: string
}

// Día del borrador del builder (nombre + lista de ítems de ejercicio).
export interface RoutineDraftDay {
  name: string
  items: RoutineDraftItem[]
}

// Slug único para el título: base slugificada + sufijo numérico si colisiona, ignorando `exclude` (edición).
export const uniqueSlug = (base: string, taken: string[], exclude?: string): string => {
  const root = slugify(base)
  const candidates = taken.filter((s) => s !== exclude)
  let candidate = root
  let n = 2
  while (candidates.includes(candidate)) candidate = `${root}-${n++}`
  return candidate
}

// Convierte el borrador editado en el payload de RoutineDraft (fallback de nombre "Día N", order 1-based).
export const routineDraftFrom = (input: {
  title: string
  objective: string
  level: string
  description: string
  days: RoutineDraftDay[]
}): {
  slug: string
  title: string
  objective: string
  level: string
  description: string
  days: { name: string; items: (Omit<RoutineDraftItem, 'exerciseName'> & { order: number })[] }[]
} => ({
  slug: input.title.trim(),
  title: input.title.trim(),
  objective: input.objective,
  level: input.level,
  description: input.description.trim(),
  days: input.days.map((d, di) => ({
    name: d.name.trim() || `Día ${di + 1}`,
    items: d.items.map((item, i) => ({
      exerciseId: item.exerciseId,
      targetSets: item.targetSets,
      targetReps: item.targetReps,
      restSec: item.restSec,
      supersetGroup: item.supersetGroup,
      order: i + 1,
    })),
  })),
})
