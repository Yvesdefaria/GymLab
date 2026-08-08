// Conversiones de unidades de peso (kg ↔ lb) y redondeo al plato disponible.
export const KG_PER_LB = 0.45359237

// Convierte kg a libras redondeando a 1 decimal.
export const kgToLb = (kg: number): number => {
  if (kg <= 0) return 0
  return Math.round(kg / KG_PER_LB * 10) / 10
}

// Convierte libras a kg redondeando a 1 decimal.
export const lbToKg = (lb: number): number => {
  if (lb <= 0) return 0
  return Math.round(lb * KG_PER_LB * 10) / 10
}

// Redondea un peso al múltiplo del plato indicado (por defecto 2,5 kg).
export const roundToNearestPlate = (kg: number, plateKg = 2.5): number =>
  kg <= 0 ? 0 : Math.round(kg / plateKg) * plateKg
