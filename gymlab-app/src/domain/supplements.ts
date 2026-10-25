// Suplementación: seed de suplementos comunes y funciones de utilidad.
import type { SupplementEntry } from './types'

// Seed de suplementos comunes.
export const SUPPLEMENT_SEED: Omit<SupplementEntry, 'id' | 'createdAt'>[] = [
  { name: 'Creatina monohidratada', dose: '5g', frequency: 'diario', active: true },
  { name: 'Proteína whey', dose: '30g', frequency: 'post_entreno', active: true },
  { name: 'Cafeína', dose: '200mg', frequency: 'pre_entreno', active: true },
  { name: 'Vitamina D3', dose: '2000 UI', frequency: 'diario', active: true },
  { name: 'Omega-3', dose: '2g', frequency: 'diario', active: true },
  { name: 'Multivitamínico', dose: '1 tableta', frequency: 'diario', active: true },
  { name: 'BCAA', dose: '10g', frequency: 'pre_entreno', active: false },
  { name: 'Citrulina malato', dose: '8g', frequency: 'pre_entreno', active: true },
]

// Filtra suplementos activos.
export const getActiveSupplements = (supplements: SupplementEntry[]): SupplementEntry[] =>
  supplements.filter((s) => s.active)

// Cuenta suplementos activos.
export const countActive = (supplements: SupplementEntry[]): number =>
  supplements.filter((s) => s.active).length

// Determina si un suplemento fue marcado hoy.
export const isCheckedToday = (s: SupplementEntry, today = new Date().toISOString().slice(0, 10)): boolean =>
  s.lastCheckedAt != null && s.lastCheckedAt.slice(0, 10) === today

// Adherencia de hoy sobre los suplementos activos: el héroe de /suplementos usa
// el mismo `isCheckedToday` que el check para no mostrar dos verdades distintas.
export interface SupplementAdherence {
  taken: number
  total: number
  pending: number
  ratio: number
}

export const todayAdherence = (
  supplements: SupplementEntry[],
  today?: string,
): SupplementAdherence => {
  const active = getActiveSupplements(supplements)
  const taken = active.filter((s) => isCheckedToday(s, today)).length
  const total = active.length
  return { taken, total, pending: total - taken, ratio: total > 0 ? taken / total : 0 }
}
