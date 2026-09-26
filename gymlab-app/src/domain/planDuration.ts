import { estimateWorkoutMinutes } from './calendar'
import { fits } from './equipmentMatch'
import { rankCandidates } from './exerciseRanking'
import type { RoutinePlan, PlannedDay, PlannedItem } from './routineResolution'
import type { Equipment, Exercise } from './types'

export const DURATION_TOLERANCE_MIN = 5

const withMinutes = (day: PlannedDay, items: PlannedItem[]): PlannedDay => ({
  ...day,
  items,
  estimatedMinutes: estimateWorkoutMinutes(items),
})

// Índice del último ítem removible: nunca el único de su grupo (sin grupos huérfanos).
const removableIndex = (items: readonly PlannedItem[], byId: ReadonlyMap<number, Exercise>): number => {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const group = byId.get(items[index].exerciseId)?.muscleGroup
    if (!group) return index
    const count = items.filter((item) => byId.get(item.exerciseId)?.muscleGroup === group).length
    if (count > 1) return index
  }
  return -1
}

const trimDay = (day: PlannedDay, target: number, byId: ReadonlyMap<number, Exercise>): PlannedDay => {
  let current = day
  while (current.estimatedMinutes > target + DURATION_TOLERANCE_MIN) {
    const index = removableIndex(current.items, byId)
    if (index === -1) break
    current = withMinutes(current, current.items.filter((_, i) => i !== index))
  }
  return current
}

const expandDay = (
  day: PlannedDay, target: number, catalog: readonly Exercise[], equipment: readonly Equipment[], byId: ReadonlyMap<number, Exercise>,
): PlannedDay => {
  let current = day
  while (current.estimatedMinutes < target - DURATION_TOLERANCE_MIN) {
    const groups = [...new Set(current.items.map((item) => byId.get(item.exerciseId)?.muscleGroup).filter(Boolean))]
    const used = new Set(current.items.map((item) => item.exerciseId))
    const next = rankCandidates(
      catalog.filter((ex) => groups.includes(ex.muscleGroup) && (ex.category ?? 'strength') === 'strength'
        && !used.has(ex.id) && fits(ex.equipment, equipment)),
    )[0]
    if (!next) break
    const template = current.items.find((item) => byId.get(item.exerciseId)?.muscleGroup === next.muscleGroup) ?? current.items[0]
    // No expandir si el candidato deja el día fuera de la tolerancia superior: desharía el recorte.
    const expanded = withMinutes(current, [...current.items, {
      exerciseId: next.id, targetSets: template.targetSets, targetReps: template.targetReps, restSec: template.restSec,
    }])
    if (expanded.estimatedMinutes > target + DURATION_TOLERANCE_MIN) break
    current = expanded
  }
  return current
}

/**
 * Ajusta cada día del plan a los minutos objetivo: una pasada de recorte y luego una de
 * expansión (sin ping-pong), tolerancia ±5 min, nunca deja un grupo sin representación.
 */
export const fitPlanToDuration = (
  plan: RoutinePlan, targetMinutes: number, catalog: readonly Exercise[], equipment: readonly Equipment[],
): RoutinePlan => {
  const byId = new Map(catalog.map((ex) => [ex.id, ex]))
  return {
    ...plan,
    days: plan.days.map((day) => expandDay(trimDay(withMinutes(day, [...day.items]), targetMinutes, byId), targetMinutes, catalog, equipment, byId)),
  }
}
