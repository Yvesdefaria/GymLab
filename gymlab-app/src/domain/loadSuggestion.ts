// Sugerencia de carga para la siguiente sesión según el último peso y la progresión configurada.
import { roundToNearestPlate } from './calculators/converter'

export const DEFAULT_PROGRESSION_PCT = 2.5

export interface LoadSuggestionInput {
  lastWeightKg: number
  prWeightKg: number
  rir?: number
  progressionPct: number
}

// Carga objetivo: parte del mayor peso (último o PR) y aplica la progresión ajustada por RIR.
export const suggestNextLoad = ({
  lastWeightKg,
  prWeightKg,
  rir,
  progressionPct,
}: LoadSuggestionInput): number => {
  const base = Math.max(lastWeightKg, prWeightKg)
  if (base <= 0) return 0
  // Con RIR alto (≥2) se progresa más; con RIR bajo (≤1) menos, para no arriesgar el levantamiento.
  const rirFactor = rir === undefined ? 1 : rir >= 2 ? 1.5 : rir <= 1 ? 0.5 : 1
  const target = base * (1 + (progressionPct / 100) * rirFactor)
  return roundToNearestPlate(target)
}

// Mayor peso entre las series completadas de un ejercicio (base para la siguiente sesión).
export const bestCompletedSetWeight = (sets: { completed?: boolean; weightKg: number }[]): number =>
  sets.reduce((acc, s) => (s.completed ? Math.max(acc, s.weightKg) : acc), 0)
