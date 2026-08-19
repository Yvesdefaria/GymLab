// Balance push/pull/legs: clasifica ejercicios y calcula volumen por categoría.
import type { MuscleGroup } from './types'

export type PushPullCategory = 'push' | 'pull' | 'legs'

// Clasificación de grupos musculares en push/pull/legs.
const MUSCLE_TO_CATEGORY: Record<MuscleGroup, PushPullCategory> = {
  pecho: 'push',
  espalda: 'pull',
  biceps: 'pull',
  triceps: 'push',
  hombro: 'push',
  pierna: 'legs',
  gluteo: 'legs',
  abdomen: 'legs',
  trapecios: 'pull',
  antebrazo: 'pull',
}

// Clasifica un grupo muscular.
export const classifyMuscle = (muscle: MuscleGroup): PushPullCategory =>
  MUSCLE_TO_CATEGORY[muscle] ?? 'push'

// Calcula volumen por categoría push/pull/legs.
export const calculatePushPullVolume = (
  volumeByMuscle: Partial<Record<MuscleGroup, number>>,
): Record<PushPullCategory, number> => {
  const result: Record<PushPullCategory, number> = { push: 0, pull: 0, legs: 0 }
  for (const [muscle, volume] of Object.entries(volumeByMuscle) as [MuscleGroup, number][]) {
    const cat = MUSCLE_TO_CATEGORY[muscle]
    if (cat) result[cat] += volume
  }
  return result
}

// Calcula porcentajes de cada categoría.
export const calculatePushPullPercentages = (
  volume: Record<PushPullCategory, number>,
): Record<PushPullCategory, number> => {
  const total = volume.push + volume.pull + volume.legs
  if (total === 0) return { push: 33.3, pull: 33.3, legs: 33.3 }
  return {
    push: (volume.push / total) * 100,
    pull: (volume.pull / total) * 100,
    legs: (volume.legs / total) * 100,
  }
}

// Detecta desequilibrio (diferencia >20% entre push y pull).
export const detectImbalance = (
  percentages: Record<PushPullCategory, number>,
): { balanced: boolean; alert: string | null } => {
  const diff = Math.abs(percentages.push - percentages.pull)
  if (diff > 20) {
    return { balanced: false, alert: `Push ${percentages.push.toFixed(0)}% vs Pull ${percentages.pull.toFixed(0)}%` }
  }
  return { balanced: true, alert: null }
}
