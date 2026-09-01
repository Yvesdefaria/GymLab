// Calculadora de hidratación diaria: base por peso corporal más recarga por ejercicio intenso.
// Recomendación de hidratación diaria para adultos activos:
// base 30 ml/kg (extremo inferior del rango 30–35 ml/kg: EFSA, Popkin 2010) +
// recarga por ejercicio intenso (0.5 L por cada 30 min, acorde a ACSM 0.4–0.8 L/h).
export const BASE_ML_PER_KG = 30
export const calcDailyWater = (pesoKg: number, minutosEjercicio = 0): number => {
  if (pesoKg <= 0) return 0
  const baseL = (pesoKg * BASE_ML_PER_KG) / 1000
  const extraL = minutosEjercicio > 0 ? (minutosEjercicio / 30) * 0.5 : 0
  return Math.round((baseL + extraL) * 10) / 10
}

// Convierte litros a nº de vasos del tamaño elegido, redondeando hacia arriba.
export const calcVasosAgua = (litros: number, tamanoVasoL = 0.25): number =>
  litros <= 0 ? 0 : Math.ceil(litros / tamanoVasoL)
