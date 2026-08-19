// Estándares de fuerza: percentiles por peso corporal para ejercicios compuestos.
// Basado en datos de powerlifting (IPF, ExRx, Strength Level).
import type { BenchmarkExercise } from './benchmark'

export type StrengthLevel = 'principiante' | 'intermedio' | 'avanzado' | 'elite'

// Tabla de percentiles por peso corporal (kg) para hombres.
// Valores: e1rm en kg. Índices: [p25, p50, p75, p90] = [principiante, intermedio, avanzado, elite].
const MALE_STANDARDS: Record<BenchmarkExercise, Record<number, [number, number, number, number]>> = {
  sentadilla: {
    60: [60, 90, 120, 155],
    70: [70, 105, 140, 180],
    80: [80, 120, 160, 205],
    90: [90, 135, 180, 230],
    100: [100, 150, 200, 255],
    110: [110, 165, 220, 280],
    120: [120, 180, 240, 305],
  },
  banca: {
    60: [50, 75, 100, 130],
    70: [60, 90, 120, 155],
    80: [70, 105, 140, 180],
    90: [80, 120, 160, 205],
    100: [90, 135, 180, 225],
    110: [100, 150, 200, 250],
    120: [110, 165, 220, 275],
  },
  peso_muerto: {
    60: [80, 115, 155, 200],
    70: [95, 135, 180, 230],
    80: [110, 155, 205, 260],
    90: [125, 175, 230, 290],
    100: [140, 195, 255, 320],
    110: [155, 215, 280, 350],
    120: [170, 235, 305, 380],
  },
  press_militar: {
    60: [35, 50, 70, 90],
    70: [40, 60, 80, 105],
    80: [50, 70, 95, 120],
    90: [55, 80, 105, 135],
    100: [60, 90, 120, 150],
    110: [70, 100, 130, 165],
    120: [80, 110, 145, 180],
  },
}

// Interpola entre pesos de la tabla.
const interpolate = (
  table: Record<number, [number, number, number, number]>,
  bodyWeight: number,
): [number, number, number, number] => {
  const weights = Object.keys(table).map(Number).sort((a, b) => a - b)

  if (bodyWeight <= weights[0]) return table[weights[0]]!
  if (bodyWeight >= weights[weights.length - 1]) return table[weights[weights.length - 1]]!

  let lower = weights[0]!
  let upper = weights[weights.length - 1]!
  for (let i = 0; i < weights.length - 1; i++) {
    if (bodyWeight >= weights[i]! && bodyWeight <= weights[i + 1]!) {
      lower = weights[i]!
      upper = weights[i + 1]!
      break
    }
  }

  const t = (bodyWeight - lower) / (upper - lower)
  const lv = table[lower]!
  const uv = table[upper]!
  return [
    lv[0]! + (uv[0]! - lv[0]!) * t,
    lv[1]! + (uv[1]! - lv[1]!) * t,
    lv[2]! + (uv[2]! - lv[2]!) * t,
    lv[3]! + (uv[3]! - lv[3]!) * t,
  ]
}

// Obtiene los umbrales de nivel para un ejercicio y peso.
export const getStrengthThresholds = (
  exercise: BenchmarkExercise,
  bodyWeight: number,
): [number, number, number, number] => {
  const table = MALE_STANDARDS[exercise]
  if (!table) return [0, 0, 0, 0]
  return interpolate(table, bodyWeight)
}

// Determina el nivel de fuerza según e1rm, peso corporal y ejercicio.
export const getStrengthLevel = (
  exercise: BenchmarkExercise,
  e1rm: number,
  bodyWeight: number,
): StrengthLevel => {
  const [, intermedio, avanzado, elite] = getStrengthThresholds(exercise, bodyWeight)
  if (e1rm >= elite) return 'elite'
  if (e1rm >= avanzado) return 'avanzado'
  if (e1rm >= intermedio) return 'intermedio'
  return 'principiante'
}

// Calcula percentil aproximado (0-100) según e1rm.
export const getStrengthPercentile = (
  exercise: BenchmarkExercise,
  e1rm: number,
  bodyWeight: number,
): number => {
  const [p25, p50, p75, p90] = getStrengthThresholds(exercise, bodyWeight)
  if (e1rm >= p90) return 90 + Math.min(10, ((e1rm - p90) / p90) * 10)
  if (e1rm >= p75) return 75 + ((e1rm - p75) / (p90 - p75)) * 15
  if (e1rm >= p50) return 50 + ((e1rm - p50) / (p75 - p50)) * 25
  if (e1rm >= p25) return 25 + ((e1rm - p25) / (p50 - p25)) * 25
  return Math.max(0, (e1rm / p25) * 25)
}
