// Utilidades de dominio para rutinas (los labels de objetivo/nivel viven en domain/catalog.ts).
import type { Objective, Level, Routine, RoutineDay, RoutineItem } from './types'
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
    days: days.map((day) => {
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

// Días con ejercicios del selector de día del home (F99.1 D2): los días vacíos o de
// descanso no figuran, y se conserva el orden del plan de la rutina.
export const selectableDays = (days: RoutineDay[], itemsByDay: ReadonlyMap<number, RoutineItem[]>) =>
  days.filter((d) => (itemsByDay.get(d.id)?.length ?? 0) > 0)

// Resolución del arranque desde un día elegido (F99.1 D4): 'start' con sus items, o
// 'empty' cuando el día no tiene ejercicios (ruta guardada R4, inalcanzable por UI).
export type DayStartResolution = { kind: 'start'; items: RoutineItem[] } | { kind: 'empty' }

export const resolveDayStart = (
  dayId: number,
  itemsByDay: ReadonlyMap<number, RoutineItem[]>,
): DayStartResolution => {
  const items = itemsByDay.get(dayId)
  if (!items || items.length === 0) return { kind: 'empty' }
  return { kind: 'start', items }
}

// Criterios del catálogo de rutinas (los mismos que expone la UI: chips + sheet de filtros).
export type RoutineCatalogFilter = {
  objective: Objective | null
  level: Level | null
  type: 'todas' | 'sesion' | 'programa'
}

// Total de ejercicios programados por rutina: suma los items de todos sus días.
// Los items de días que ya no existen se ignoran; las rutinas sin items quedan en 0.
export const countItemsByRoutine = (
  days: readonly RoutineDay[],
  items: readonly RoutineItem[],
): Record<number, number> => {
  const routineByDay = new Map<number, number>()
  const counts: Record<number, number> = {}
  for (const day of days) {
    routineByDay.set(day.id, day.routineId)
    counts[day.routineId] = 0
  }
  for (const item of items) {
    const routineId = routineByDay.get(item.routineDayId)
    if (routineId == null) continue
    counts[routineId] += 1
  }
  return counts
}

// Predicado único del modo resultados: búsqueda sobre el título localizado + objetivo + nivel + tipo.
// El título entra como parámetro porque la localización vive en la capa i18n, no en el dominio.
export const routineMatchesFilters = (
  routine: Routine,
  localizedTitle: string,
  filters: RoutineCatalogFilter,
  query: string,
): boolean => {
  const q = query.trim().toLowerCase()
  if (q && !localizedTitle.toLowerCase().includes(q)) return false
  if (filters.objective && routine.objective !== filters.objective) return false
  if (filters.level && routine.level !== filters.level) return false
  if (filters.type === 'sesion' && routine.daysCount !== 1) return false
  if (filters.type === 'programa' && routine.daysCount <= 1) return false
  return true
}

// Semana del programa activo (1-based) contada en días locales desde su fecha de inicio.
// Se calcula en UTC para que el cambio de horario no mueva el corte de semana.
export const programWeekNumber = (startDate: string, today: string): number => {
  const toUtcDay = (value: string) => {
    const [year, month, day] = value.split('-').map(Number)
    return Date.UTC(year, month - 1, day)
  }
  const diffDays = Math.floor((toUtcDay(today) - toUtcDay(startDate)) / 86_400_000)
  if (diffDays < 0) return 1
  return Math.floor(diffDays / 7) + 1
}
