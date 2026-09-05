// Detección de estancamiento: identifica ejercicios donde el e1rm no mejora en 4+ semanas.
import type { WorkoutSet, Exercise } from './types'
import { toLocalDateStr, addLocalDays } from './dates'
import { setLocalDate, avgE1rmInRange } from './setStats'

export type PlateauSuggestion = 'volume' | 'variant' | 'deload'

export interface PlateauAlert {
  exerciseId: number
  exerciseName: string
  weeksStagnant: number
  currentE1rm: number
  previousE1rm: number
  pctChange: number
  suggestion: PlateauSuggestion
}

// Detecta ejercicios estancados: < 2% mejora en e1rm durante las últimas 4 semanas vs las 4 anteriores.
export const detectPlateaus = (
  sets: WorkoutSet[],
  exercises: Exercise[],
  now = new Date()
): PlateauAlert[] => {
  const nowStr = toLocalDateStr(now)
  const recentStart = addLocalDays(nowStr, -28)
  const prevStart = addLocalDays(nowStr, -56)
  const stagnationThreshold = 0.02 // 2%

  // Solo considerar ejercicios con al menos 3 series en el período reciente.
  const exerciseIds = new Set(
    sets
      .filter(
        (s) =>
          s.completed &&
          !s.isWarmup &&
          s.weightKg > 0 &&
          setLocalDate(s) >= recentStart
      )
      .map((s) => s.exerciseId)
  )

  const exerciseMap = new Map(exercises.map((e) => [e.id, e]))
  const alerts: PlateauAlert[] = []

  for (const exerciseId of exerciseIds) {
    const recentAvg = avgE1rmInRange(sets, recentStart, nowStr, exerciseId)
    const prevAvg = avgE1rmInRange(sets, prevStart, recentStart, exerciseId)

    if (recentAvg <= 0 || prevAvg <= 0) continue

    const pctChange = (recentAvg - prevAvg) / prevAvg
    if (pctChange >= stagnationThreshold) continue

    // Calcular semanas estancadas: buscar cuántas semanas seguidas sin mejora.
    let weeksStagnant = 0
    let checkEnd = nowStr
    for (let w = 0; w < 12; w++) {
      const weekStart = addLocalDays(checkEnd, -7)
      const weekAvg = avgE1rmInRange(sets, weekStart, checkEnd, exerciseId)
      const prevWeekAvg = avgE1rmInRange(sets, addLocalDays(weekStart, -7), weekStart, exerciseId)

      if (weekAvg <= 0 || prevWeekAvg <= 0) break
      if ((weekAvg - prevWeekAvg) / prevWeekAvg >= stagnationThreshold) break

      weeksStagnant++
      checkEnd = weekStart
    }

    if (weeksStagnant < 3) continue // Mínimo 3 semanas para alertar.

    const exercise = exerciseMap.get(exerciseId)
    const name = exercise?.name ?? `Ejercicio #${exerciseId}`

    // Sugerencia basada en duración del estancamiento.
    const suggestion: PlateauSuggestion =
      weeksStagnant >= 6 ? 'deload' : weeksStagnant >= 4 ? 'variant' : 'volume'

    alerts.push({
      exerciseId,
      exerciseName: name,
      weeksStagnant,
      currentE1rm: Math.round(recentAvg * 10) / 10,
      previousE1rm: Math.round(prevAvg * 10) / 10,
      pctChange: Math.round(pctChange * 100),
      suggestion,
    })
  }

  return alerts.sort((a, b) => b.weeksStagnant - a.weeksStagnant)
}
