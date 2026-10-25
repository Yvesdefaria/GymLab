// Proyección de objetivos: calcula fecha estimada de próximo hit basado en tasa de mejora de e1rm.
import type { WorkoutSet } from './types'
import { toLocalDateStr, addLocalDays } from './dates'
import { groupSetsByExercise, avgE1rmInGroupRange } from './setStats'

export interface GoalProjection {
  exerciseId: number
  exerciseName: string
  currentE1rm: number
  targetE1rm: number
  weeklyImprovementRate: number // kg por semana
  weeksToTarget: number
  estimatedDate: string | null // YYYY-MM-DD o null si ya superó
  reached: boolean
}

// Calcula proyecciones para ejercicios con datos recientes.
// `goals` mapea exerciseId → targetE1rm (objetivo del usuario).
// `byExercise` permite inyectar el agrupamiento ya resuelto por la página (F103/T8):
// la home lo comparte con las alertas de estancamiento en vez de reconstruirlo.
export const buildGoalProjections = (
  sets: WorkoutSet[],
  exercises: { id: number; name: string }[],
  goals: Record<number, number>,
  now = new Date(),
  byExercise: Map<number, WorkoutSet[]> = groupSetsByExercise(sets)
): GoalProjection[] => {
  const nowStr = toLocalDateStr(now)
  const recentStart = addLocalDays(nowStr, -28) // últimos 28 días
  const prevStart = addLocalDays(nowStr, -56) // 28 días antes de eso

  const exerciseMap = new Map(exercises.map((e) => [e.id, e.name]))
  const projections: GoalProjection[] = []

  for (const [exerciseIdStr, targetE1rm] of Object.entries(goals)) {
    const exerciseId = Number(exerciseIdStr)
    const target = Number(targetE1rm)
    if (!exerciseId || !target || target <= 0) continue

    const currentE1rm = avgE1rmInGroupRange(byExercise, exerciseId, recentStart, nowStr)
    const prevE1rm = avgE1rmInGroupRange(byExercise, exerciseId, prevStart, recentStart)

    if (currentE1rm <= 0) continue

    // Ya superó el objetivo.
    if (currentE1rm >= target) {
      projections.push({
        exerciseId,
        exerciseName: exerciseMap.get(exerciseId) ?? `Ejercicio #${exerciseId}`,
        currentE1rm: Math.round(currentE1rm * 10) / 10,
        targetE1rm: target,
        weeklyImprovementRate: 0,
        weeksToTarget: 0,
        estimatedDate: null,
        reached: true,
      })
      continue
    }

    // Calcular tasa semanal de mejora (promedio de las últimas 4 semanas).
    const weeklyRates: number[] = []
    for (let w = 0; w < 4; w++) {
      const weekEnd = addLocalDays(nowStr, -(w * 7))
      const weekStart = addLocalDays(weekEnd, -7)
      const prevWeekEnd = weekStart
      const prevWeekStart = addLocalDays(prevWeekEnd, -7)

      const weekAvg = avgE1rmInGroupRange(byExercise, exerciseId, weekStart, weekEnd)
      const prevWeekAvg = avgE1rmInGroupRange(byExercise, exerciseId, prevWeekStart, prevWeekEnd)

      if (weekAvg > 0 && prevWeekAvg > 0) {
        weeklyRates.push(weekAvg - prevWeekAvg)
      }
    }

    // Si no hay suficientes datos históricos, usar una tasa por defecto conservadora.
    const avgRate = weeklyRates.length >= 2
      ? weeklyRates.reduce((a, b) => a + b, 0) / weeklyRates.length
      : prevE1rm > 0
        ? (currentE1rm - prevE1rm) / 4 // estimar de la comparación mensual
        : 0.5 // tasa por defecto: 0.5 kg/semana

    // Si la tasa es muy baja o negativa, usar mínimo 0.1 kg/semana.
    const weeklyImprovement = Math.max(avgRate, 0.1)
    const gap = target - currentE1rm
    const weeksToTarget = Math.ceil(gap / weeklyImprovement)
    const estimatedDate = addLocalDays(nowStr, weeksToTarget * 7)

    projections.push({
      exerciseId,
      exerciseName: exerciseMap.get(exerciseId) ?? `Ejercicio #${exerciseId}`,
      currentE1rm: Math.round(currentE1rm * 10) / 10,
      targetE1rm: target,
      weeklyImprovementRate: Math.round(weeklyImprovement * 100) / 100,
      weeksToTarget,
      estimatedDate,
      reached: false,
    })
  }

  return projections.sort((a, b) => a.weeksToTarget - b.weeksToTarget)
}

// F132.4: helpers de la vista de Objetivos. La fila existe para TODO objetivo
// del store (aunque no tenga series recientes), el héroe es el próximo hito y
// el estado «todos alcanzados» solo cuenta objetivos con proyección.
export interface GoalRow {
  exerciseId: number
  exerciseName: string
  targetE1rm: number
  projection: GoalProjection | null
}

export const buildGoalRows = (
  goals: Record<number, number>,
  projections: GoalProjection[],
  exercises: { id: number; name: string }[]
): GoalRow[] => {
  const byExercise = new Map(projections.map((p) => [p.exerciseId, p]))
  const nameById = new Map(exercises.map((e) => [e.id, e.name]))
  return Object.entries(goals).map(([idStr, target]) => {
    const exerciseId = Number(idStr)
    const projection = byExercise.get(exerciseId) ?? null
    return {
      exerciseId,
      exerciseName:
        projection?.exerciseName ?? nameById.get(exerciseId) ?? `Ejercicio #${exerciseId}`,
      targetE1rm: Number(target),
      projection,
    }
  })
}

// Avance 0..1 con clamp: el héroe y las filas no pintan pistas fuera de rango.
export const goalProgressRatio = (
  p: Pick<GoalProjection, 'currentE1rm' | 'targetE1rm'>
): number => {
  if (p.targetE1rm <= 0) return 0
  return Math.min(1, Math.max(0, p.currentE1rm / p.targetE1rm))
}

// Próximo hito: menor ETA; a igualdad, mayor avance. Ignora los alcanzados.
export const pickFeaturedGoal = (projections: GoalProjection[]): GoalProjection | null =>
  projections
    .filter((p) => !p.reached)
    .reduce<GoalProjection | null>((best, p) => {
      if (!best) return p
      if (p.weeksToTarget < best.weeksToTarget) return p
      if (
        p.weeksToTarget === best.weeksToTarget &&
        goalProgressRatio(p) > goalProgressRatio(best)
      ) {
        return p
      }
      return best
    }, null)

// Solo es «todo alcanzado» si cada objetivo del store tiene su proyección y
// está alcanzado; si uno no tiene datos, no se puede afirmar el total.
export const isEveryGoalReached = (
  goals: Record<number, number>,
  projections: GoalProjection[]
): boolean => {
  const ids = Object.keys(goals)
  if (ids.length === 0) return false
  const byExercise = new Map(projections.map((p) => [p.exerciseId, p]))
  return ids.every((id) => byExercise.get(Number(id))?.reached === true)
}