// Calculadora Navy: estimación de % grasa corporal con método de la Marina.
// Fórmulas oficiales de la U.S. Navy (sin picómetro).

export type Sex = 'hombre' | 'mujer'

export interface NavyInput {
  sex: Sex
  heightCm: number
  neckCm: number
  waistCm: number
  hipCm?: number // solo mujeres
}

export interface NavyResult {
  bodyFatPct: number
  leanMassKg: number | null
  fatMassKg: number | null
  classification: string
}

// Clasificación por rangos de % grasa.
const classify = (pct: number, sex: Sex): string => {
  if (sex === 'hombre') {
    if (pct < 6) return 'Esencialmente graso'
    if (pct < 14) return 'Atlético'
    if (pct < 18) return 'Fitness'
    if (pct < 25) return 'Promedio'
    return 'Obeso'
  }
  if (pct < 14) return 'Esencialmente grasa'
  if (pct < 21) return 'Atlética'
  if (pct < 25) return 'Fitness'
  if (pct < 32) return 'Promedio'
  return 'Obesa'
}

// Fórmula Navy para hombres: 495 / (1.0324 - 0.19077 × log10(cintura - cuello) + 0.15456 × log10(altura)) - 450
export const calcNavyMen = (heightCm: number, neckCm: number, waistCm: number): number => {
  const h = heightCm / 2.54 // pulgadas
  const n = neckCm / 2.54
  const w = waistCm / 2.54
  const diff = w - n
  if (diff <= 0 || h <= 0) return 0
  return 495 / (1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(h)) - 450
}

// Fórmula Navy para mujeres: 495 / (1.29579 - 0.35004 × log10(cintura + cadera - cuello) + 0.22100 × log10(altura)) - 450
export const calcNavyWomen = (heightCm: number, neckCm: number, waistCm: number, hipCm: number): number => {
  const h = heightCm / 2.54
  const n = neckCm / 2.54
  const w = waistCm / 2.54
  const hp = hipCm / 2.54
  const sum = w + hp - n
  if (sum <= 0 || h <= 0) return 0
  return 495 / (1.29579 - 0.35004 * Math.log10(sum) + 0.22100 * Math.log10(h)) - 450
}

// Calcula % grasa y clasificación.
export const calcNavy = (input: NavyInput, weightKg?: number): NavyResult => {
  const bodyFatPct = input.sex === 'hombre'
    ? Math.max(0, calcNavyMen(input.heightCm, input.neckCm, input.waistCm))
    : Math.max(0, input.hipCm ? calcNavyWomen(input.heightCm, input.neckCm, input.waistCm, input.hipCm) : 0)

  const leanMassKg = weightKg ? weightKg * (1 - bodyFatPct / 100) : null
  const fatMassKg = weightKg ? weightKg * (bodyFatPct / 100) : null

  return {
    bodyFatPct: Math.round(bodyFatPct * 10) / 10,
    leanMassKg: leanMassKg ? Math.round(leanMassKg * 10) / 10 : null,
    fatMassKg: fatMassKg ? Math.round(fatMassKg * 10) / 10 : null,
    classification: classify(bodyFatPct, input.sex),
  }
}
