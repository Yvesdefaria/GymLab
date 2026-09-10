// Utilidades de dominio para rutinas (los labels de objetivo/nivel viven en domain/catalog.ts).
import type { Objective, Level, RoutineDay, RoutineItem } from './types'
import type { RoutineDraft } from '@/data/repositories/types'

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

// Reordena los días del borrador del builder: lista vacía, un solo día o índices
// fuera de rango son no-op; el movimiento real lo delega en reorderArray.
export const reorderDays = (days: RoutineDraftDay[], fromIndex: number, toIndex: number): RoutineDraftDay[] => {
  if (days.length < 2 || fromIndex < 0 || toIndex < 0 || fromIndex >= days.length || toIndex >= days.length) {
    return days
  }
  return reorderArray(days, fromIndex, toIndex)
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

// Clona una rutina predefinida en un RoutineDraft listo para createRoutine.
// No copia imageUrl; setea basedOnId; re-indexa order de items 1-based por día.
export const cloneRoutineDraft = (
  source: { id: number; title: string; objective: string; level: string; description: string },
  days: RoutineDay[],
  items: RoutineItem[],
): RoutineDraft => {
  // Agrupar items por routineDayId y re-indexar order 1-based.
  const itemsByDay = new Map<number, RoutineItem[]>()
  for (const item of items) {
    const list = itemsByDay.get(item.routineDayId) ?? []
    list.push(item)
    itemsByDay.set(item.routineDayId, list)
  }

  return {
    slug: source.title,
    title: source.title,
    objective: source.objective as Objective,
    level: source.level as Level,
    description: source.description,
    basedOnId: source.id,
    days: days.map((day, dayIdx) => {
      const dayItems = itemsByDay.get(day.id) ?? []
      return {
        name: day.name,
        items: dayItems.map((item, i) => ({
          exerciseId: item.exerciseId,
          targetSets: item.targetSets,
          targetReps: item.targetReps,
          restSec: item.restSec,
          order: i + 1,
          supersetGroup: item.supersetGroup,
          notes: item.notes,
        })),
      }
    }),
  }
}
