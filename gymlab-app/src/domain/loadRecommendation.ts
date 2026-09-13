// Motor puro y único de recomendación de carga (F97.2/97.3/97.4).
// Reemplaza a `suggestNextLoad` y al camino de sugerencias de `adaptiveRoutine`:
// la base es el promedio del top set de las últimas N sesiones (peso observado, sin
// warmups), el PR es un techo estricto y el ajuste por RIR solo des-amplifica el paso.
import { roundToNearestPlate } from './calculators/converter'
import type { WorkoutSet } from './types'

// Ventana de sesiones recientes: heurística de ingeniería (research L2.C5), no un óptimo
// calibrado por evidencia. Reduce el ruido de una sola sesión sin promediar de más.
export const RECENT_SESSIONS_N = 5

// Top set de una sesión: peso observado máximo, ignorando warmups, series no completadas
// y pesos no positivos. Es peso real, nunca un e1RM estimado.
const sessionTopSet = (sets: WorkoutSet[]): number =>
  sets.reduce((top, s) => {
    if (!s.completed || s.isWarmup || s.weightKg <= 0) return top
    return Math.max(top, s.weightKg)
  }, 0)

// Promedio del top set de las últimas N sesiones (más recientes primero por id de workout,
// que es monótono). Con menos de N sesiones promedia las disponibles; 0 si no hay ninguna.
export const recentTopSetAverage = (sets: WorkoutSet[], n = RECENT_SESSIONS_N): number => {
  if (n <= 0 || sets.length === 0) return 0
  const byWorkout = new Map<number, WorkoutSet[]>()
  for (const s of sets) {
    const group = byWorkout.get(s.workoutId)
    if (group) group.push(s)
    else byWorkout.set(s.workoutId, [s])
  }
  const latest = [...byWorkout.entries()]
    .sort((a, b) => b[0] - a[0])
    .slice(0, n)
    .map(([, group]) => sessionTopSet(group))
    .filter((top) => top > 0)
  if (latest.length === 0) return 0
  return latest.reduce((sum, top) => sum + top, 0) / latest.length
}

export interface LoadRecommendationInput {
  // Promedio del top set de las últimas N sesiones (0 si no hay historial).
  recentTopSetAvgKg: number
  // Top set de la sesión más reciente / sesión viva (0 si no hay).
  lastSessionTopSetKg: number
  // PR del ejercicio: techo estricto, nunca piso.
  prWeightKg: number
  rir?: number
  progressionPct: number
  plateKg?: number
}

// Resultado: carga final, base elegida y si el PR recortó el objetivo.
export interface LoadRecommendation {
  weightKg: number
  baseKg: number
  capped: boolean
}

// Factor RIR conservador (D4/97.3): cerca del fallo (RIR ≤ 1) el paso se reduce a la mitad;
// lejos del fallo nunca se amplifica por encima de la progresión configurada.
const rirFactor = (rir?: number): number => {
  if (rir === undefined) return 1
  return rir <= 1 ? 0.5 : 1
}

export const recommendLoad = ({
  recentTopSetAvgKg,
  lastSessionTopSetKg,
  prWeightKg,
  rir,
  progressionPct,
  plateKg,
}: LoadRecommendationInput): LoadRecommendation => {
  // Base: promedio reciente → sesión más reciente → PR (último recurso). 0 solo si no hay ninguna.
  const baseKg = recentTopSetAvgKg > 0 ? recentTopSetAvgKg : lastSessionTopSetKg > 0 ? lastSessionTopSetKg : prWeightKg
  if (baseKg <= 0) return { weightKg: 0, baseKg: 0, capped: false }
  const target = baseKg * (1 + (progressionPct / 100) * rirFactor(rir))
  const rounded = roundToNearestPlate(target, plateKg)
  // El PR es techo estricto: nunca se redondea hacia arriba por encima de él.
  const capped = prWeightKg > 0 && rounded > prWeightKg
  return { weightKg: capped ? prWeightKg : rounded, baseKg, capped }
}
