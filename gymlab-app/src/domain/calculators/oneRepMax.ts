export const roundToNearest = (value: number, step: number): number =>
  Math.round(value / step) * step

// Fórmula de Epley (recomendada para bajas repeticiones)
export const calcEpleyOneRepMax = (pesoKg: number, reps: number): number => {
  if (pesoKg <= 0 || reps <= 0) return 0
  if (reps <= 1) return roundToNearest(pesoKg, 0.5)
  return roundToNearest(pesoKg * (1 + reps / 30), 0.5)
}

// Fórmula de Brzycki (más precisa para rangos 3–10)
export const calcBrzyckiOneRepMax = (pesoKg: number, reps: number): number => {
  if (pesoKg <= 0 || reps <= 0) return 0
  if (reps === 1) return roundToNearest(pesoKg, 0.5)
  const est = pesoKg * (36 / (37 - reps))
  return roundToNearest(est, 0.5)
}

export const oneRepMaxLabel = (
  pesoKg: number,
  reps: number
): { epley: number; brzycki: number; diferenciaKg: number } => {
  const epley = calcEpleyOneRepMax(pesoKg, reps)
  const brzycki = calcBrzyckiOneRepMax(pesoKg, reps)
  return { epley, brzycki, diferenciaKg: Math.round((brzycki - epley) * 10) / 10 }
}
