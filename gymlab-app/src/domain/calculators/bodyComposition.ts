// Composición corporal: densidad y % grasa (Jackson-Pollock + Siri), ratios WHtR/WHR, simetría y series temporales.
import type { BodyMeasurementEntry, BodyWeightEntry, Sex, SkinfoldEntry, SkinfoldSite } from '../types'
import { calcIMC } from './imc'

export type BodyFatCategory = 'esencial' | 'atleta' | 'en_forma' | 'promedio' | 'alto'
export type WhtrCategory = 'saludable' | 'riesgo_aumentado' | 'riesgo_alto'
export type WhrCategory = 'bajo' | 'moderado' | 'alto'

export type JacksonPollockProtocol = '3' | '7'

export interface JacksonPollockInput {
  sites: Partial<Record<SkinfoldSite, number>>
  sex: Sex
  age: number
}

export interface JacksonPollockResult {
  bodyDensity: number | null
  bodyFatPct: number | null
  missingSites: SkinfoldSite[]
}

const SITES_7: SkinfoldSite[] = [
  'pectoral',
  'axilar',
  'triceps',
  'subescapular',
  'abdominal',
  'suprailiaco',
  'muslo',
]

const SITES_3_MALE: SkinfoldSite[] = ['pectoral', 'abdominal', 'muslo']
const SITES_3_FEMALE: SkinfoldSite[] = ['triceps', 'suprailiaco', 'muslo']

// Pliegues del protocolo de 3 según sexo (difieren por la distribución de grasa).
export const threeSiteKeys = (sex: Sex): SkinfoldSite[] =>
  sex === 'male' ? SITES_3_MALE : SITES_3_FEMALE

// Pliegues del protocolo de 7 (comunes para ambos sexos).
export const sevenSiteKeys = (): SkinfoldSite[] => SITES_7

// Suma los pliegues requeridos; devuelve null si falta alguno, porque el protocolo exige todos.
const sumSites = (
  sites: Partial<Record<SkinfoldSite, number>>,
  keys: SkinfoldSite[],
): number | null => {
  let total = 0
  for (const k of keys) {
    const v = sites[k]
    if (v == null || v <= 0) return null
    total += v
  }
  return total
}

// Densidad corporal estimada con las ecuaciones de Jackson-Pollock (protocolo de 3 o 7 pliegues).
export const jacksonPollockDensity = (
  input: JacksonPollockInput,
  protocol: JacksonPollockProtocol,
): number | null => {
  const keys = protocol === '7' ? SITES_7 : threeSiteKeys(input.sex)
  const sum = sumSites(input.sites, keys)
  if (sum == null || input.age <= 0) return null
  const age = input.age
  const sq = sum * sum
  let bd: number
  if (protocol === '7') {
    bd =
      input.sex === 'male'
        ? 1.112 - 0.00043499 * sum + 0.00000055 * sq - 0.00028826 * age
        : 1.097 - 0.00046971 * sum + 0.00000056 * sq - 0.00012828 * age
  } else {
    bd =
      input.sex === 'male'
        ? 1.10938 - 0.0008267 * sum + 0.0000016 * sq - 0.0002574 * age
        : 1.0994921 - 0.0009929 * sum + 0.0000023 * sq - 0.0001392 * age
  }
  return Math.round(bd * 10000) / 10000
}

// % de grasa a partir de la densidad corporal usando la ecuación de Siri.
export const densityToBodyFatPct = (density: number): number => {
  if (density <= 0) return 0
  return Math.round((495 / density - 450) * 10) / 10
}

// Resultado completo de Jackson-Pollock: densidad, % de grasa y pliegues faltantes.
export const calcJacksonPollock = (
  input: JacksonPollockInput,
  protocol: JacksonPollockProtocol,
): JacksonPollockResult => {
  const keys = protocol === '7' ? SITES_7 : threeSiteKeys(input.sex)
  const density = jacksonPollockDensity(input, protocol)
  return {
    bodyDensity: density,
    bodyFatPct: density == null ? null : densityToBodyFatPct(density),
    missingSites: keys.filter((k) => input.sites[k] == null || input.sites[k] <= 0),
  }
}

// Categoría de % de grasa corporal, con rangos diferenciados por sexo.
export const bodyFatCategory = (pct: number, sex: Sex): BodyFatCategory => {
  if (sex === 'male') {
    if (pct < 6) return 'esencial'
    if (pct <= 13) return 'atleta'
    if (pct <= 17) return 'en_forma'
    if (pct <= 24) return 'promedio'
    return 'alto'
  }
  if (pct < 14) return 'esencial'
  if (pct <= 20) return 'atleta'
  if (pct <= 24) return 'en_forma'
  if (pct <= 31) return 'promedio'
  return 'alto'
}

export const bodyFatCategoryLabel = (cat: BodyFatCategory): string => {
  const labels: Record<BodyFatCategory, string> = {
    esencial: 'Esencial',
    atleta: 'Atleta',
    en_forma: 'En forma',
    promedio: 'Promedio',
    alto: 'Elevado',
  }
  return labels[cat]
}

export const bodyFatCategoryColor = (cat: BodyFatCategory): string => {
  const colors: Record<BodyFatCategory, string> = {
    esencial: 'var(--color-info)',
    atleta: 'var(--color-success)',
    en_forma: 'var(--color-cta)',
    promedio: 'var(--color-cta-deep)',
    alto: 'var(--color-danger)',
  }
  return colors[cat]
}

// Masa de grasa en kg a partir del peso y el % de grasa.
export const calcFatMass = (weightKg: number, bodyFatPct: number): number => {
  if (weightKg <= 0 || bodyFatPct == null || bodyFatPct < 0) return 0
  return Math.round((weightKg * (bodyFatPct / 100)) * 10) / 10
}

// Masa magra en kg (peso total menos masa grasa).
export const calcFatFreeMass = (weightKg: number, bodyFatPct: number): number => {
  if (weightKg <= 0 || bodyFatPct == null || bodyFatPct < 0) return 0
  return Math.round(weightKg * (1 - bodyFatPct / 100) * 10) / 10
}

// Ratio cintura/altura (WHtR), marcador de riesgo cardio-metabólico.
export const calcWhtr = (waistCm: number, heightCm: number): number | null => {
  if (waistCm <= 0 || heightCm <= 0) return null
  return Math.round((waistCm / heightCm) * 100) / 100
}

// Categoría de riesgo según WHtR (referencias de la OMS).
export const whtrCategory = (whtr: number): WhtrCategory => {
  if (whtr <= 0.5) return 'saludable'
  if (whtr <= 0.6) return 'riesgo_aumentado'
  return 'riesgo_alto'
}

export const whtrCategoryLabel = (cat: WhtrCategory): string => {
  const labels: Record<WhtrCategory, string> = {
    saludable: 'Saludable',
    riesgo_aumentado: 'Riesgo aumentado',
    riesgo_alto: 'Riesgo alto',
  }
  return labels[cat]
}

export const whtrCategoryColor = (cat: WhtrCategory): string => {
  const colors: Record<WhtrCategory, string> = {
    saludable: 'var(--color-success)',
    riesgo_aumentado: 'var(--color-cta)',
    riesgo_alto: 'var(--color-danger)',
  }
  return colors[cat]
}

// Ratio cintura/cadera (WHR), distribuidor de grasa corporal.
export const calcWhr = (waistCm: number, hipCm: number): number | null => {
  if (waistCm <= 0 || hipCm <= 0) return null
  return Math.round((waistCm / hipCm) * 100) / 100
}

// Categoría de riesgo según WHR, con umbrales diferenciados por sexo.
export const whrCategory = (whr: number, sex: Sex): WhrCategory => {
  const [low, high] = sex === 'male' ? [0.9, 1.0] : [0.8, 0.9]
  if (whr < low) return 'bajo'
  if (whr < high) return 'moderado'
  return 'alto'
}

export const whrCategoryLabel = (cat: WhrCategory): string => {
  const labels: Record<WhrCategory, string> = {
    bajo: 'Riesgo bajo',
    moderado: 'Riesgo moderado',
    alto: 'Riesgo alto',
  }
  return labels[cat]
}

export const whrCategoryColor = (cat: WhrCategory): string => {
  const colors: Record<WhrCategory, string> = {
    bajo: 'var(--color-success)',
    moderado: 'var(--color-cta)',
    alto: 'var(--color-danger)',
  }
  return colors[cat]
}

// Diferencia % entre una medida izquierda y su homóloga derecha (asimetría entre lados).
export const calcSymmetryPct = (leftCm: number, rightCm: number): number | null => {
  if (leftCm <= 0 || rightCm <= 0) return null
  return Math.round((Math.abs(leftCm - rightCm) / ((leftCm + rightCm) / 2)) * 100 * 10) / 10
}

export interface ImcPoint {
  date: string
  imc: number
}

/** Serie temporal de IMC a partir de los registros de peso y la altura guardada en meta. */
export const buildImcSeries = (
  entries: BodyWeightEntry[],
  heightCm: number
): ImcPoint[] => {
  if (heightCm <= 0) return []
  return entries
    .map((e) => ({ date: e.localDate, imc: calcIMC(e.weightKg, heightCm) }))
    .filter((p) => p.imc > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export interface BodyCompPoint {
  date: string
  bodyFatPct: number | null
  fatMassKg: number | null
  fatFreeMassKg: number | null
  boneMassKg: number | null
  muscleMassKg: number | null
}

/** Estima la masa ósea (kg) a partir de peso, altura, edad y sexo.
 *  Base: Heymsfield et al. (1989) — BMC ≈ 0.055 × peso (hombres) / 0.050 × peso (mujeres),
 *  ajustado por edad (pérdida ~0.5% anual tras 30 años) y talla. */
export const estimateBoneMass = (
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
): number => {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 0
  // Porcentaje base según sexo
  const basePct = sex === 'male' ? 0.055 : 0.050
  // Ajuste por edad: pérdida del 0.5% anual a partir de los 30
  const ageFactor = age > 30 ? 1 - (age - 30) * 0.005 : 1
  // Ajuste por talla: personas más altas tienen huesos proporcionalmente más grandes
  const heightFactor = heightCm / 175
  const pct = basePct * Math.max(ageFactor, 0.7) * Math.max(heightFactor, 0.85)
  return Math.round(weightKg * pct * 10) / 10
}

/** Masa muscular esquelética estimada: masa libre de grasa menos masa ósea.
 *  El resto (órganos, agua, tejido conectivo) se asigna a "other". */
export const estimateMuscleMass = (fatFreeMassKg: number, boneMassKg: number): number => {
  const muscle = fatFreeMassKg - boneMassKg
  return Math.max(0, Math.round(muscle * 10) / 10)
}

/** Serie temporal de composición corporal: % grasa + masas derivadas por registro de pliegues. */
export const buildBodyCompSeries = (
  entries: SkinfoldEntry[],
  heightCm?: number,
): BodyCompPoint[] => {
  return entries
    .map((e) => {
      const r7 = calcJacksonPollock({ sites: e.sites, sex: e.sex, age: e.age }, '7')
      const r3 = calcJacksonPollock({ sites: e.sites, sex: e.sex, age: e.age }, '3')
      const pct = r7.bodyFatPct ?? r3.bodyFatPct
      const weight = e.weightKg != null && e.weightKg > 0 ? e.weightKg : null
      const fatMass = pct != null && weight != null ? calcFatMass(weight, pct) : null
      const fatFree = pct != null && weight != null ? calcFatFreeMass(weight, pct) : null
      const h = heightCm && heightCm > 0 ? heightCm : 170
      const bone = weight != null ? estimateBoneMass(weight, h, e.age, e.sex) : null
      const muscle = fatFree != null && bone != null ? estimateMuscleMass(fatFree, bone) : null
      return {
        date: e.localDate,
        bodyFatPct: pct,
        fatMassKg: fatMass,
        fatFreeMassKg: fatFree,
        boneMassKg: bone,
        muscleMassKg: muscle,
      }
    })
    .filter((p) => p.bodyFatPct != null)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export interface RatiosPoint {
  date: string
  whtr: number | null
  whr: number | null
}

/** Serie temporal de ratios WHtR/WHR a partir de las medidas registradas. */
export const buildRatiosSeries = (
  entries: BodyMeasurementEntry[],
  heightCm: number
): RatiosPoint[] => {
  return entries
    .map((e) => {
      const { cintura, caderas } = e.values
      const whtr = cintura != null && heightCm > 0 ? calcWhtr(cintura, heightCm) : null
      const whr = cintura != null && caderas != null ? calcWhr(cintura, caderas) : null
      return { date: e.localDate, whtr, whr }
    })
    .filter((p) => p.whtr != null || p.whr != null)
    .sort((a, b) => a.date.localeCompare(b.date))
}
