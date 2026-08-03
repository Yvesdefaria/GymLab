export const KG_PER_LB = 0.45359237

export const kgToLb = (kg: number): number => {
  if (kg <= 0) return 0
  return Math.round(kg / KG_PER_LB * 10) / 10
}

export const lbToKg = (lb: number): number => {
  if (lb <= 0) return 0
  return Math.round(lb * KG_PER_LB * 10) / 10
}

export const roundToNearestPlate = (kg: number, plateKg = 2.5): number =>
  kg <= 0 ? 0 : Math.round(kg / plateKg) * plateKg
