// Resolución de rutinas: deriva el equipamiento que exige una rutina predefinida y
// elige la que calza. Dominio puro: catálogo y rutinas entran por parámetro.
import type { Equipment, Exercise, Level, Objective, Routine, RoutineDay, RoutineItem } from './types'

export interface RoutineMatch {
  objective: Objective
  level: Level
  daysPerWeek: number
  equipment: readonly Equipment[]
}

// Equipamiento que una rutina exige: unión del equipamiento de sus ejercicios.
export const requiredEquipmentOf = (
  routineId: number,
  days: readonly RoutineDay[],
  items: readonly RoutineItem[],
  exercisesById: ReadonlyMap<number, Exercise>,
): Equipment[] => {
  const dayIds = new Set(days.filter((d) => d.routineId === routineId).map((d) => d.id))
  const required = new Set<Equipment>()
  for (const item of items) {
    if (!dayIds.has(item.routineDayId)) continue
    const exercise = exercisesById.get(item.exerciseId)
    if (!exercise) continue
    for (const eq of exercise.equipment) required.add(eq)
  }
  return [...required]
}

// Requerido ⊆ disponible. Disponible vacío = sin filtro (entra todo).
const fits = (required: readonly Equipment[], available: readonly Equipment[]): boolean =>
  available.length === 0 || required.every((eq) => available.includes(eq))

// Busca la predefinida que calza: objetivo y nivel EXACTOS, equipamiento ⊆ el declarado y,
// si no hay días exactos, la más cercana. Nunca relaja nivel ni equipamiento (spec, decisión 2).
export const findPredefinedRoutine = (
  match: RoutineMatch,
  routines: readonly Routine[],
  requiredByRoutineId: ReadonlyMap<number, readonly Equipment[]>,
): Routine | undefined => {
  const candidates = routines.filter(
    (r) =>
      !r.isCustom &&
      r.objective === match.objective &&
      r.level === match.level &&
      fits(requiredByRoutineId.get(r.id) ?? [], match.equipment),
  )
  if (candidates.length === 0) return undefined
  // Desempate por id: determinista y sin depender del orden del seed.
  return [...candidates].sort((a, b) => {
    const diff = Math.abs(a.daysCount - match.daysPerWeek) - Math.abs(b.daysCount - match.daysPerWeek)
    return diff !== 0 ? diff : a.id - b.id
  })[0]
}
