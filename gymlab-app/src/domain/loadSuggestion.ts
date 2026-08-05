export const PLATE_INCREMENT_KG = 2.5
export const DEFAULT_PROGRESSION_PCT = 2.5

export interface LoadSuggestionInput {
  lastWeightKg: number
  prWeightKg: number
  rir?: number
  progressionPct: number
}

export const roundToPlate = (weightKg: number): number =>
  Math.round(weightKg / PLATE_INCREMENT_KG) * PLATE_INCREMENT_KG

export const suggestNextLoad = ({
  lastWeightKg,
  prWeightKg,
  rir,
  progressionPct,
}: LoadSuggestionInput): number => {
  const base = Math.max(lastWeightKg, prWeightKg)
  if (base <= 0) return 0
  const rirFactor = rir === undefined ? 1 : rir >= 2 ? 1.5 : rir <= 1 ? 0.5 : 1
  const target = base * (1 + (progressionPct / 100) * rirFactor)
  return roundToPlate(target)
}

export const bestCompletedSetWeight = (sets: { completed?: boolean; weightKg: number }[]): number =>
  sets.reduce((acc, s) => (s.completed ? Math.max(acc, s.weightKg) : acc), 0)
