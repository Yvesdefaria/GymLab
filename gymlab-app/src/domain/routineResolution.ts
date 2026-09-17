// Resolución de rutinas: deriva el equipamiento que exige una rutina predefinida y
// elige la que calza. Dominio puro: catálogo y rutinas entran por parámetro.
import type { Equipment, Exercise, Level, MuscleGroup, Objective, Routine, RoutineDay, RoutineItem } from './types'
import { COMMON_EXERCISE_SLUGS } from './catalog'

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

export interface PlanRequest {
  level: Level
  objective: Objective
  daysPerWeek: number
  equipment: readonly Equipment[]
}

export interface PlannedItem {
  exerciseId: number
  targetSets: number
  targetReps: number
  restSec: number
}

export interface PlannedDay {
  dayNumber: number
  name: string
  items: PlannedItem[]
}

export interface CoverageReport {
  omittedGroups: MuscleGroup[]
  droppedDays: number[]
}

export interface RoutinePlan {
  source: 'predefined' | 'generated'
  basedOnId?: number
  title: string
  objective: Objective
  level: Level
  daysPerWeek: number
  days: PlannedDay[]
  coverage: CoverageReport
}

// Split por días por semana (heredado del planner anterior).
const SPLIT_BY_DAYS: Record<number, MuscleGroup[][]> = {
  3: [['pecho', 'espalda', 'pierna']],
  4: [['pecho', 'hombro'], ['espalda', 'biceps'], ['pierna', 'gluteo'], ['pierna', 'abdomen']],
  5: [['pecho', 'triceps'], ['espalda', 'biceps'], ['pierna'], ['hombro', 'trapecios'], ['pierna', 'gluteo']],
  6: [['pecho'], ['espalda'], ['pierna'], ['hombro', 'trapecios'], ['biceps', 'triceps'], ['pierna', 'gluteo']],
}

// Volumen semanal óptimo por nivel y objetivo (series semanales por grupo).
const VOLUME_BY_LEVEL: Record<Level, Record<Objective, number>> = {
  principiante: { fuerza: 10, volumen: 10, resistencia: 12, definicion: 10, general: 10 },
  intermedio: { fuerza: 12, volumen: 14, resistencia: 15, definicion: 12, general: 12 },
  avanzado: { fuerza: 14, volumen: 16, resistencia: 18, definicion: 14, general: 14 },
}

const REPS_BY_OBJECTIVE: Record<Objective, number> = { fuerza: 5, volumen: 10, resistencia: 18, definicion: 12, general: 10 }
const REST_BY_OBJECTIVE: Record<Objective, number> = { fuerza: 180, volumen: 90, resistencia: 45, definicion: 60, general: 90 }

// Ranking de selección: primero los de la lista curada, después por slug (determinista y sin i18n).
const COMMON_INDEX = new Map(COMMON_EXERCISE_SLUGS.map((slug, i) => [slug, i]))

// Aísla el ranking para poder afinarlo sin tocar el resto del generador (spec, riesgos).
const rankCandidates = (candidates: readonly Exercise[]): Exercise[] =>
  [...candidates].sort((a, b) => {
    const ia = COMMON_INDEX.get(a.slug) ?? Number.POSITIVE_INFINITY
    const ib = COMMON_INDEX.get(b.slug) ?? Number.POSITIVE_INFINITY
    if (ia !== ib) return ia - ib
    return a.slug.localeCompare(b.slug)
  })

const clamp = (n: number, min: number, max: number): number => Math.min(Math.max(n, min), max)

// Genera un plan contra el catálogo real. Pura y determinista.
export const generateRoutinePlan = (request: PlanRequest, catalog: readonly Exercise[]): RoutinePlan => {
  const days = clamp(Math.round(request.daysPerWeek), 3, 6)
  const split = SPLIT_BY_DAYS[days] ?? SPLIT_BY_DAYS[4]
  const weeklyVolume = VOLUME_BY_LEVEL[request.level][request.objective]
  const omitted = new Set<MuscleGroup>()
  const planned: PlannedDay[] = []

  split.forEach((groups, index) => {
    const items: PlannedItem[] = []
    for (const group of groups) {
      const candidates = catalog.filter(
        (ex) =>
          ex.muscleGroup === group &&
          (ex.category ?? 'strength') === 'strength' &&
          request.equipment.every((eq) => ex.equipment.includes(eq)),
      )
      if (candidates.length === 0) {
        omitted.add(group)
        continue
      }
      const daysTouchingGroup = split.filter((day) => day.includes(group)).length
      const weeksShare = weeklyVolume / daysTouchingGroup
      const howMany = clamp(Math.round(weeksShare / 3.5), 1, 4)
      const sets = Math.max(1, Math.round(weeksShare / howMany))
      for (const exercise of rankCandidates(candidates).slice(0, howMany)) {
        items.push({
          exerciseId: exercise.id,
          targetSets: sets,
          targetReps: REPS_BY_OBJECTIVE[request.objective],
          restSec: REST_BY_OBJECTIVE[request.objective],
        })
      }
    }
    // Un día sin ejercicios cae: reportarlo es más honesto que entregarlo vacío.
    if (items.length > 0) planned.push({ dayNumber: index + 1, name: `Día ${index + 1}`, items })
  })

  return {
    source: 'generated',
    title: `Plan ${request.objective} · ${days} días`,
    objective: request.objective,
    level: request.level,
    daysPerWeek: days,
    days: planned,
    coverage: {
      omittedGroups: [...omitted],
      droppedDays: split.map((_, i) => i + 1).filter((n) => !planned.some((d) => d.dayNumber === n)),
    },
  }
}

// Orquesta: predefinida si calza, generador si no.
// Necesita los días y los ítems porque la predefinida hay que CONVERTIRLA a PlannedDay[].
export const planRoutine = (
  request: PlanRequest,
  routines: readonly Routine[],
  catalog: readonly Exercise[],
  requiredByRoutineId: ReadonlyMap<number, readonly Equipment[]>,
  routineDays: readonly RoutineDay[],
  routineItems: readonly RoutineItem[],
): RoutinePlan => {
  const match = findPredefinedRoutine(request, routines, requiredByRoutineId)
  if (!match) return generateRoutinePlan(request, catalog)

  // Convierte la predefinida respetando dayIndex y el order de cada ítem.
  const days = routineDays.filter((day) => day.routineId === match.id).sort((a, b) => a.dayIndex - b.dayIndex)
  const planned: PlannedDay[] = days
    .map((day) => ({
      dayNumber: day.dayIndex + 1,
      name: day.name,
      items: routineItems
        .filter((item) => item.routineDayId === day.id)
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          exerciseId: item.exerciseId,
          targetSets: item.targetSets,
          targetReps: item.targetReps,
          restSec: item.restSec,
        })),
    }))
    .filter((day) => day.items.length > 0)

  return {
    source: 'predefined',
    basedOnId: match.id,
    title: match.title,
    objective: match.objective,
    level: match.level,
    daysPerWeek: request.daysPerWeek,
    days: planned,
    // Si matcheó, por construcción el usuario puede hacerla entera.
    coverage: { omittedGroups: [], droppedDays: [] },
  }
}
