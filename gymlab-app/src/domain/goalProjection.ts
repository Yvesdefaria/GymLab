// Proyección de objetivos: calcula fecha estimada de próximo hit basado en tasa de mejora de e1rm.
import type { WorkoutSet } from './types'
import { toLocalDateStr, addLocalDays } from './dates'
import { estimate1RM } from './prs'

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

// e1rm promedio de un ejercicio en un período (solo series completadas).
const avgE1rmInPeriod = (
  sets: WorkoutSet[],
  exerciseId: number,
  start: string,
  end: string
): number => {
  const inRange = sets.filter((s) => {
    const d = s.createdAt.length >= 10 ? s.createdAt.slice(0, 10) : toLocalDateStr(new Date(s.createdAt))
    return (
      s.exerciseId === exerciseId &&
      s.completed &&
      !s.isWarmup &&
      s.weightKg > 0 &&
      s.reps > 0 &&
      d >= start &&
      d < end
    )
  })
  if (inRange.length === 0) return 0
  const total = inRange.reduce((acc, s) => acc + estimate1RM(s.weightKg, s.reps), 0)
  return total / inRange.length
}

// Calcula proyecciones para ejercicios con datos recientes.
// `goals` mapea exerciseId → targetE1rm (objetivo del usuario).
export const buildGoalProjections = (
  sets: WorkoutSet[],
  exercises: { id: number; name: string }[],
  goals: Record<number, number>,
  now = new Date()
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

    const currentE1rm = avgE1rmInPeriod(sets, exerciseId, recentStart, nowStr)
    const prevE1rm = avgE1rmInPeriod(sets, exerciseId, prevStart, recentStart)

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

      const weekAvg = avgE1rmInPeriod(sets, exerciseId, weekStart, weekEnd)
      const prevWeekAvg = avgE1rmInPeriod(sets, exerciseId, prevWeekStart, prevWeekEnd)

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
