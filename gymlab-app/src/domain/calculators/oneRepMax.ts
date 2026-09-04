// Calculadoras de 1RM estimado con las fórmulas de Epley y Brzycki, y su comparación.
import { estimate1RM } from '../prs'

export const roundToNearest = (value: number, step: number): number =>
  Math.round(value / step) * step

// Fórmula de Epley (recomendada para bajas repeticiones)
export const calcEpleyOneRepMax = (pesoKg: number, reps: number): number => {
  if (pesoKg <= 0 || reps <= 0) return 0
  if (reps <= 1) return roundToNearest(pesoKg, 0.5)
  return roundToNearest(pesoKg * (1 + reps / 30), 0.5)
}

// Fórmula de Brzycki (más precisa para rangos 3–10): reutiliza estimate1RM del motor
// de PRs (single source of truth) para que calculadora y récords coincidan.
export const calcBrzyckiOneRepMax = (pesoKg: number, reps: number): number =>
  estimate1RM(pesoKg, reps)

// Combina ambas estimaciones y la diferencia entre ellas para la UI de comparación.
export const oneRepMaxLabel = (
  pesoKg: number,
  reps: number
): { epley: number; brzycki: number; diferenciaKg: number } => {
  const epley = calcEpleyOneRepMax(pesoKg, reps)
  const brzycki = calcBrzyckiOneRepMax(pesoKg, reps)
  return { epley, brzycki, diferenciaKg: Math.round((brzycki - epley) * 10) / 10 }
}
