// Calculadora Navy: estimación de % grasa corporal con método de la Marina.
// Fórmulas oficiales de la U.S. Navy (sin picómetro).

// Clasificación por rangos de % grasa. La tabla canónica vive en bodyComposition
// (Jackson-Pollock) para que Navy y JP no den etiquetas distintas al mismo cuerpo.
import { bodyFatCategory, type BodyFatCategory } from './bodyComposition'

export type Sex = 'hombre' | 'mujer'

export interface NavyInput {
  sex: Sex
  heightCm: number
  neckCm: number
  waistCm: number
  hipCm?: number // solo mujeres
}

export type NavyClass = 'essential' | 'athletic' | 'fitness' | 'average' | 'obese'

export interface NavyResult {
  bodyFatPct: number
  leanMassKg: number | null
  fatMassKg: number | null
  classification: NavyClass
}

const navyClassFromCategory: Record<BodyFatCategory, NavyClass> = {
  esencial: 'essential',
  atleta: 'athletic',
  en_forma: 'fitness',
  promedio: 'average',
  alto: 'obese',
}

// Clasificación por rangos de % grasa (el copy vive en i18n; el dominio solo devuelve la clave).
export const classifyNavy = (pct: number, sex: Sex): NavyClass =>
  navyClassFromCategory[bodyFatCategory(pct, sex === 'hombre' ? 'male' : 'female')]

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
    classification: classifyNavy(bodyFatPct, input.sex),
  }
}
