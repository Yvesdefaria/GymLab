// Construcción de los sets pre-cargados de una sesión: peso, repeticiones, calentamiento y pre-carga.
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

// Redondeo a cuartos de kg para pesos intermedios alcanzables con los platos disponibles.
const roundQuarter = (v: number) => Math.round(v * 4) / 4

// Genera los sets de trabajo (y de calentamiento si está activo) a partir de la última sesión y la configuración.
export const buildWorkoutSets = (o: BuildWorkoutSetsOptions): WorkoutSetDraft[] => {
  const last = o.last
  const reps = o.targetReps > 0 ? o.targetReps : (last?.reps ?? 0)

  let workingWeight = 0
  // El peso de trabajo parte del último usado y se ajusta según el modo de pre-carga elegido.
  if (last && last.weightKg > 0) {
    if (o.preloadMode === 'plus_kg') workingWeight = last.weightKg + o.preloadValue
    else if (o.preloadMode === 'plus_pct') workingWeight = last.weightKg * (1 + o.preloadValue / 100)
    else workingWeight = last.weightKg
  }
  // Sin pre-carga activa los sets empiezan vacíos para que el usuario los rellene.
  if (!o.preloadEnabled) workingWeight = 0

  // Nº de sets de trabajo: el configurado en pre-carga o, si no, el objetivo de la rutina.
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
