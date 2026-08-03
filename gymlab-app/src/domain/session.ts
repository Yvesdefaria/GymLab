import type { PreloadWeightMode } from './settings'

export interface LastSetInfo {
  weightKg: number
  reps: number
}

export interface WorkoutSetDraft {
  weightKg: number
  reps: number
  isWarmup?: boolean
}

export interface BuildWorkoutSetsOptions {
  targetSets: number
  targetReps: number
  last?: LastSetInfo
  preloadEnabled: boolean
  preloadSetCount: number
  preloadMode: PreloadWeightMode
  preloadValue: number
  warmupEnabled: boolean
  warmupPercents: number[]
}

const roundQuarter = (v: number) => Math.round(v * 4) / 4

export const buildWorkoutSets = (o: BuildWorkoutSetsOptions): WorkoutSetDraft[] => {
  const last = o.last
  const reps = o.targetReps > 0 ? o.targetReps : (last?.reps ?? 0)

  let workingWeight = 0
  if (last && last.weightKg > 0) {
    if (o.preloadMode === 'plus_kg') workingWeight = last.weightKg + o.preloadValue
    else if (o.preloadMode === 'plus_pct') workingWeight = last.weightKg * (1 + o.preloadValue / 100)
    else workingWeight = last.weightKg
  }
  if (!o.preloadEnabled) workingWeight = 0

  const workingSets = o.preloadSetCount > 0 ? o.preloadSetCount : Math.max(1, o.targetSets)

  const sets: WorkoutSetDraft[] = []
  if (o.warmupEnabled && workingWeight > 0) {
    for (const p of o.warmupPercents) {
      sets.push({
        weightKg: roundQuarter(workingWeight * (p / 100)),
        reps: Math.max(1, reps),
        isWarmup: true,
      })
    }
  }
  for (let i = 0; i < workingSets; i++) {
    sets.push({ weightKg: roundQuarter(workingWeight), reps, isWarmup: false })
  }
  return sets
}
