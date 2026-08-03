// Recomendación de hidratación diaria para adultos activos:
// base 35 ml/kg (hombre/mujer promedio) + recarga por ejercicio intenso.
export const calcDailyWater = (pesoKg: number, minutosEjercicio = 0): number => {
  if (pesoKg <= 0) return 0
  const baseL = pesoKg * 0.035
  const extraL = minutosEjercicio > 0 ? (minutosEjercicio / 30) * 0.5 : 0
  return Math.round((baseL + extraL) * 10) / 10
}

export const calcVasosAgua = (litros: number, tamanoVasoL = 0.25): number =>
  litros <= 0 ? 0 : Math.ceil(litros / tamanoVasoL)
