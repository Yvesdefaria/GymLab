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
