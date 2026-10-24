// Resúmenes puros del bloque Cuerpo y progreso: peso por rango, delta entre fechas,
// conteo de fatiga y orden de fotos. Sin React ni Dexie.
import type { BodyWeightEntry, FatigueLevel, MuscleGroup, ProgressPhotoEntry } from './types'
import { inRange, type StatsRange } from './dates'
import { MUSCLE_GROUP_LABELS_ES } from './catalog'

export type WeightSummary = {
  latest: BodyWeightEntry | null
  deltaKg: number | null
  minKg: number | null
  maxKg: number | null
  count: number
}

// Las fechas locales son YYYY-MM-DD: comparar como string equivale a comparar por fecha.
const byDateAsc = (a: BodyWeightEntry, b: BodyWeightEntry): number =>
  a.localDate.localeCompare(b.localDate)

// Dos decimales (gramos) para que 80.5 − 78.4 no arrastre ruido de coma flotante.
const roundKg = (value: number): number => Math.round(value * 100) / 100

// Resumen del peso dentro del rango activo. El héroe, la gráfica, los stats y el
// historial comparten esta misma ventana para no mostrar dos verdades distintas.
export const weightSummary = (
  entries: BodyWeightEntry[],
  range: StatsRange,
  now: number = Date.now(),
): WeightSummary => {
  const inWindow = entries.filter((e) => inRange(e.localDate, range, now)).sort(byDateAsc)

  if (inWindow.length === 0) {
    return { latest: null, deltaKg: null, minKg: null, maxKg: null, count: 0 }
  }

  const latest = inWindow[inWindow.length - 1]
  const first = inWindow[0]
  const weights = inWindow.map((e) => e.weightKg)

  return {
    latest,
    deltaKg: inWindow.length > 1 ? roundKg(latest.weightKg - first.weightKg) : null,
    minKg: Math.min(...weights),
    maxKg: Math.max(...weights),
    count: inWindow.length,
  }
}

export type WeightDelta = {
  fromKg: number
  toKg: number
  deltaKg: number
}

// Delta de peso entre dos fechas concretas (comparador de fotos). Null si falta una.
export const weightDeltaBetween = (
  entries: BodyWeightEntry[],
  dateA: string,
  dateB: string,
): WeightDelta | null => {
  const from = entries.find((e) => e.localDate === dateA)
  const to = entries.find((e) => e.localDate === dateB)
  if (!from || !to) return null
  return { fromKg: from.weightKg, toKg: to.weightKg, deltaKg: roundKg(to.weightKg - from.weightKg) }
}

export type FatigueCounts = {
  fresh: number
  warm: number
  fatigued: number
  sore: number
  noData: number
}

// Conteo por nivel para el resumen del mapa. Los grupos sin nivel son «sin datos»,
// no «recuperados»: el mapa no debe pintar verde/dorado sin evidencia.
export const fatigueCounts = (
  fatigue: Partial<Record<MuscleGroup, FatigueLevel>>,
): FatigueCounts => {
  const counts: FatigueCounts = { fresh: 0, warm: 0, fatigued: 0, sore: 0, noData: 0 }
  for (const group of Object.keys(MUSCLE_GROUP_LABELS_ES) as MuscleGroup[]) {
    const level = fatigue[group]
    if (level) counts[level] += 1
    else counts.noData += 1
  }
  return counts
}

// Timeline de fotos: más reciente primero, sin mutar el array de entrada.
export const sortPhotosByDateDesc = (photos: ProgressPhotoEntry[]): ProgressPhotoEntry[] =>
  [...photos].sort((a, b) => b.localDate.localeCompare(a.localDate))

// Cantidad de ángulos presentes en una fecha (0–3); la usan el héroe y el timeline.
export const countPhotoAngles = (entry: ProgressPhotoEntry): number =>
  (entry.frontUri ? 1 : 0) + (entry.sideUri ? 1 : 0) + (entry.backUri ? 1 : 0)
