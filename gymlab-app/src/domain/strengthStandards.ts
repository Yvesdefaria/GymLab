// Estándares de fuerza: percentiles por peso corporal para ejercicios compuestos.
// Basado en datos de powerlifting (IPF, ExRx, Strength Level).
import type { BenchmarkExercise } from './benchmark'
import type { Sex } from './types'

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

// Tabla de percentiles por peso corporal (kg) para mujeres. Misma estructura
// [p25, p50, p75, p90], derivada de las columnas Beginner/Novice/Intermediate/
// Advanced/Elite (p5/p20/p50/p80/p95) de Strength Level 2026 (≈1M resultados
// femeninos por levantamiento): p25 = Nov + 1/6·(Int−Nov), p75 = Int + 5/6·(Adv−Int),
// p90 = Adv + 2/3·(Elite−Adv).
const FEMALE_STANDARDS: Record<
  BenchmarkExercise,
  Record<number, [number, number, number, number]>
> = {
  sentadilla: {
    60: [53, 72, 95, 119],
    65: [57, 76, 99, 124],
    70: [60, 80, 104, 130],
    75: [63, 84, 108, 134],
    80: [66, 88, 112, 138],
    85: [69, 91, 116, 143],
    90: [72, 94, 120, 147],
    95: [76, 98, 124, 151],
    100: [79, 101, 127, 155],
    105: [81, 104, 131, 159],
    110: [84, 107, 134, 162],
    115: [86, 109, 137, 165],
    120: [88, 112, 140, 169],
  },
  banca: {
    60: [34, 47, 63, 81],
    65: [36, 50, 67, 85],
    70: [39, 53, 71, 89],
    75: [41, 56, 74, 92],
    80: [43, 59, 77, 96],
    85: [46, 61, 79, 99],
    90: [48, 64, 82, 103],
    95: [50, 66, 85, 106],
    100: [52, 69, 88, 109],
    105: [54, 71, 90, 111],
    110: [56, 73, 93, 114],
    115: [58, 75, 95, 117],
    120: [60, 77, 98, 119],
  },
  peso_muerto: {
    60: [64, 86, 111, 138],
    65: [68, 90, 116, 144],
    70: [73, 95, 121, 149],
    75: [76, 99, 126, 154],
    80: [79, 102, 130, 158],
    85: [82, 106, 134, 163],
    90: [85, 109, 137, 168],
    95: [88, 113, 141, 172],
    100: [91, 116, 145, 176],
    105: [94, 119, 148, 179],
    110: [96, 122, 152, 183],
    115: [99, 125, 155, 187],
    120: [101, 128, 158, 190],
  },
  press_militar: {
    60: [22, 31, 41, 52],
    65: [24, 32, 43, 54],
    70: [25, 34, 45, 57],
    75: [27, 36, 47, 59],
    80: [28, 37, 49, 61],
    85: [29, 39, 51, 63],
    90: [30, 40, 52, 65],
    95: [32, 42, 54, 67],
    100: [33, 43, 56, 69],
    105: [34, 45, 57, 70],
    110: [35, 46, 59, 72],
    115: [36, 47, 60, 73],
    120: [37, 48, 61, 75],
  },
}

const standardsFor = (sex: Sex) => (sex === 'female' ? FEMALE_STANDARDS : MALE_STANDARDS)

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

// Obtiene los umbrales de nivel para un ejercicio, peso y sexo.
export const getStrengthThresholds = (
  exercise: BenchmarkExercise,
  bodyWeight: number,
  sex: Sex = 'male',
): [number, number, number, number] => {
  const table = standardsFor(sex)[exercise]
  if (!table) return [0, 0, 0, 0]
  return interpolate(table, bodyWeight)
}

// Determina el nivel de fuerza según e1rm, peso corporal, ejercicio y sexo.
export const getStrengthLevel = (
  exercise: BenchmarkExercise,
  e1rm: number,
  bodyWeight: number,
  sex: Sex = 'male',
): StrengthLevel => {
  const [, intermedio, avanzado, elite] = getStrengthThresholds(exercise, bodyWeight, sex)
  if (e1rm >= elite) return 'elite'
  if (e1rm >= avanzado) return 'avanzado'
  if (e1rm >= intermedio) return 'intermedio'
  return 'principiante'
}

// Calcula percentil aproximado (0-100) según e1rm, peso y sexo.
export const getStrengthPercentile = (
  exercise: BenchmarkExercise,
  e1rm: number,
  bodyWeight: number,
  sex: Sex = 'male',
): number => {
  const [p25, p50, p75, p90] = getStrengthThresholds(exercise, bodyWeight, sex)
  if (e1rm >= p90) return 90 + Math.min(10, ((e1rm - p90) / p90) * 10)
  if (e1rm >= p75) return 75 + ((e1rm - p75) / (p90 - p75)) * 15
  if (e1rm >= p50) return 50 + ((e1rm - p50) / (p75 - p50)) * 25
  if (e1rm >= p25) return 25 + ((e1rm - p25) / (p50 - p25)) * 25
  return Math.max(0, (e1rm / p25) * 25)
}
