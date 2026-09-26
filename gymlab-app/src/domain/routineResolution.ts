// Resolución de rutinas: deriva el equipamiento que exige una rutina predefinida y
// elige la que calza. Dominio puro: catálogo y rutinas entran por parámetro.
import type { Equipment, Exercise, Level, MuscleGroup, Objective, Routine, RoutineDay, RoutineItem } from './types'
import { estimateWorkoutMinutes } from './calendar'
import { fits } from './equipmentMatch'
import { rankCandidates } from './exerciseRanking'
import { fitPlanToDuration } from './planDuration'

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
  // Duración objetivo por sesión; sin valor se usa DEFAULT_SESSION_DURATION_MIN.
  sessionDurationMin?: number
  // Nombres del plan; sin valor se usa DEFAULT_NAMING (retrocompatible).
  naming?: PlanNaming
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
  estimatedMinutes: number
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

// Nombres inyectables: la UI los traduce sin que el dominio conozca idiomas.
export interface PlanNaming {
  dayName: (dayNumber: number) => string
  title: (objective: Objective, days: number) => string
}

export const DEFAULT_NAMING: PlanNaming = {
  dayName: (dayNumber) => `Día ${dayNumber}`,
  title: (objective, days) => `Plan ${objective} · ${days} días`,
}

export const DEFAULT_SESSION_DURATION_MIN = 60

// Plan con días reales: la UI decide con esto si hay algo que mostrar o guardar.
export const hasPlannedDays = (plan: RoutinePlan | null | undefined): plan is RoutinePlan =>
  !!plan && plan.days.length > 0

// Split por días por semana (heredado del planner anterior).
// 2 días: superior / inferior. 4 días: las dos sesiones de pierna van intercaladas, con
// espalda+bíceps en medio, para que ningún grupo caiga en días consecutivos.
// 3 días: empuje / tirón / inferior. Estaba como UN solo día con tres grupos (heredado del
// planner retirado, donde la spec mandaba "conservar, no reescribir"), así que pedir 3 días
// devolvía un plan de 1 día. Se deriva de las predefinidas de 3 días del seed: r1 y r5 usan
// exactamente pecho+hombro+triceps / espalda+biceps / pierna+gluteo.
const SPLIT_BY_DAYS: Record<number, MuscleGroup[][]> = {
  2: [['pecho', 'espalda', 'hombro', 'biceps', 'triceps'], ['pierna', 'gluteo', 'abdomen']],
  3: [['pecho', 'hombro', 'triceps'], ['espalda', 'biceps'], ['pierna', 'gluteo', 'abdomen']],
  4: [['pecho', 'hombro'], ['pierna', 'gluteo'], ['espalda', 'biceps'], ['pierna', 'abdomen']],
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

// Los tipos mienten en runtime: `level` y `objective` llegan de datos persistidos (Dexie,
// localStorage) y pueden no estar en estas tablas aunque el tipo las declare completas. Sin
// guarda, un nivel desconocido daba TypeError (segundo índice sobre undefined) y un objetivo
// desconocido propagaba NaN hasta targetSets. Se lee defensivamente, una vez por plan.
const DEFAULT_WEEKLY_VOLUME = 12 // paridad con el planner retirado
const readRow = <V>(table: unknown, key: string, fallback: V): V => {
  if (typeof table !== 'object' || table === null) return fallback
  const value = (table as Record<string, V | undefined>)[key]
  return value === undefined ? fallback : value
}

const clamp = (n: number, min: number, max: number): number => Math.min(Math.max(n, min), max)

// Genera un plan contra el catálogo real. Pura y determinista.
export const generateRoutinePlan = (request: PlanRequest, catalog: readonly Exercise[]): RoutinePlan => {
  const days = clamp(Math.round(request.daysPerWeek), 2, 6)
  const naming = request.naming ?? DEFAULT_NAMING
  const split = SPLIT_BY_DAYS[days] ?? SPLIT_BY_DAYS[4]
  const weeklyVolume = readRow<number>(VOLUME_BY_LEVEL[request.level], request.objective, DEFAULT_WEEKLY_VOLUME)
  const targetReps = readRow<number>(REPS_BY_OBJECTIVE, request.objective, REPS_BY_OBJECTIVE.general)
  const restSec = readRow<number>(REST_BY_OBJECTIVE, request.objective, REST_BY_OBJECTIVE.general)
  const omitted = new Set<MuscleGroup>()
  const planned: PlannedDay[] = []
  // Cuántas veces apareció cada grupo: si el split lo repite (p. ej. pierna en 5 días),
  // cada aparición consume la siguiente ventana del ranking y no repite ejercicios.
  const groupOccurrence = new Map<MuscleGroup, number>()

  split.forEach((groups, index) => {
    const items: PlannedItem[] = []
    for (const group of groups) {
      const candidates = catalog.filter(
        (ex) =>
          ex.muscleGroup === group &&
          (ex.category ?? 'strength') === 'strength' &&
          // `fits`: el generador es una segunda VÍA, no una segunda REGLA (spec, línea 186).
          fits(ex.equipment, request.equipment),
      )
      if (candidates.length === 0) {
        omitted.add(group)
        continue
      }
      const daysTouchingGroup = split.filter((day) => day.includes(group)).length
      const weeksShare = weeklyVolume / daysTouchingGroup
      const howMany = clamp(Math.round(weeksShare / 3.5), 1, 4)
      const sets = Math.max(1, Math.round(weeksShare / howMany))
      const occurrence = groupOccurrence.get(group) ?? 0
      groupOccurrence.set(group, occurrence + 1)
      const ranked = rankCandidates(candidates)
      const start = occurrence * howMany
      const picked = ranked.slice(start, start + howMany)
      if (picked.length < howMany) {
        // Catálogo corto: completa desde el inicio sin repetir lo ya elegido en esta aparición.
        const pickedIds = new Set(picked.map((exercise) => exercise.id))
        picked.push(...ranked.filter((exercise) => !pickedIds.has(exercise.id)).slice(0, howMany - picked.length))
      }
      for (const exercise of picked) {
        items.push({ exerciseId: exercise.id, targetSets: sets, targetReps, restSec })
      }
    }
    // Un día sin ejercicios cae: reportarlo es más honesto que entregarlo vacío.
    if (items.length > 0) planned.push({ dayNumber: index + 1, name: naming.dayName(index + 1), items, estimatedMinutes: estimateWorkoutMinutes(items) })
  })

  return {
    source: 'generated',
    title: naming.title(request.objective, days),
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
  const target = request.sessionDurationMin ?? DEFAULT_SESSION_DURATION_MIN
  // El ajuste por duración se aplica acá, en las DOS vías del resolutor; la generación
  // directa (`generateRoutinePlan` sin resolver) conserva su contrato sin fit.
  if (!match) return fitPlanToDuration(generateRoutinePlan(request, catalog), target, catalog, request.equipment)

  // Convierte la predefinida respetando dayIndex y el order de cada ítem.
  const days = routineDays.filter((day) => day.routineId === match.id).sort((a, b) => a.dayIndex - b.dayIndex)
  const planned: PlannedDay[] = days
    .map((day) => {
      const items = routineItems
        .filter((item) => item.routineDayId === day.id)
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          exerciseId: item.exerciseId,
          targetSets: item.targetSets,
          targetReps: item.targetReps,
          restSec: item.restSec,
        }))
      return {
        dayNumber: day.dayIndex + 1,
        name: day.name,
        items,
        estimatedMinutes: estimateWorkoutMinutes(items),
      }
    })
    .filter((day) => day.items.length > 0)

  return fitPlanToDuration(
    {
      source: 'predefined',
      basedOnId: match.id,
      title: match.title,
      objective: match.objective,
      level: match.level,
      daysPerWeek: request.daysPerWeek,
      days: planned,
      // La predefinida cae días sin ítems igual que el generador (filter de arriba), así que la
      // cobertura tiene que reportarlo: asumir "por construcción entra entera" daba señal falsa.
      // `omittedGroups` queda vacío a propósito: una predefinida no tiene un conjunto esperado de
      // grupos contra el que medir omisiones; los suyos son los que ella misma declara.
      coverage: {
        omittedGroups: [],
        droppedDays: days
          .filter((day) => !planned.some((p) => p.dayNumber === day.dayIndex + 1))
          .map((day) => day.dayIndex + 1),
      },
    },
    target,
    catalog,
    request.equipment,
  )
}
