import type { Sex, SkinfoldSite } from '../types'

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

export const threeSiteKeys = (sex: Sex): SkinfoldSite[] =>
  sex === 'male' ? SITES_3_MALE : SITES_3_FEMALE

export const sevenSiteKeys = (): SkinfoldSite[] => SITES_7

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

export const densityToBodyFatPct = (density: number): number => {
  if (density <= 0) return 0
  return Math.round((495 / density - 450) * 10) / 10
}

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

export const calcFatMass = (weightKg: number, bodyFatPct: number): number => {
  if (weightKg <= 0 || bodyFatPct == null || bodyFatPct < 0) return 0
  return Math.round((weightKg * (bodyFatPct / 100)) * 10) / 10
}

export const calcFatFreeMass = (weightKg: number, bodyFatPct: number): number => {
  if (weightKg <= 0 || bodyFatPct == null || bodyFatPct < 0) return 0
  return Math.round(weightKg * (1 - bodyFatPct / 100) * 10) / 10
}

export const calcWhtr = (waistCm: number, heightCm: number): number | null => {
  if (waistCm <= 0 || heightCm <= 0) return null
  return Math.round((waistCm / heightCm) * 100) / 100
}

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

export const calcWhr = (waistCm: number, hipCm: number): number | null => {
  if (waistCm <= 0 || hipCm <= 0) return null
  return Math.round((waistCm / hipCm) * 100) / 100
}

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

export const calcSymmetryPct = (leftCm: number, rightCm: number): number | null => {
  if (leftCm <= 0 || rightCm <= 0) return null
  return Math.round((Math.abs(leftCm - rightCm) / ((leftCm + rightCm) / 2)) * 100 * 10) / 10
}
