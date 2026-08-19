// Benchmark tests: test de fuerza predefinidos con tracking de mejora.
// Fórmula de Brzycki para estimar 1RM: weight × (36 / (37 - reps)).
import type { BenchmarkResult } from './types'

export type BenchmarkExercise = 'sentadilla' | 'banca' | 'peso_muerto' | 'press_militar'

// Estima 1RM usando la fórmula de Brzycki.
export const estimate1RM = (weightKg: number, reps: number): number => {
  if (reps <= 0 || weightKg <= 0) return 0
  if (reps === 1) return weightKg
  return weightKg * (36 / (37 - reps))
}

// Intervalo recomendado para re-testear (en semanas).
export const RECOMMENDED_WEEKS_BETWEEN_TESTS = 6

// Determina si es momento de re-testear.
export const shouldRetest = (lastTestDate: string | null): boolean => {
  if (!lastTestDate) return true
  const last = new Date(lastTestDate).getTime()
  const now = Date.now()
  const weeksElapsed = (now - last) / (1000 * 60 * 60 * 24 * 7)
  return weeksElapsed >= RECOMMENDED_WEEKS_BETWEEN_TESTS
}

// Calcula mejora entre dos benchmarks del mismo ejercicio.
export const calcImprovement = (
  current: BenchmarkResult,
  previous: BenchmarkResult | null,
): { delta: number; pct: number } | null => {
  if (!previous) return null
  const delta = current.e1rm - previous.e1rm
  const pct = previous.e1rm > 0 ? (delta / previous.e1rm) * 100 : 0
  return { delta, pct }
}

// Ordena benchmarks por fecha (más reciente primero).
export const sortByDate = (results: BenchmarkResult[]): BenchmarkResult[] =>
  [...results].sort((a, b) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime())

// Obtiene el último benchmark de un ejercicio.
export const getLatest = (
  results: BenchmarkResult[],
  exercise: BenchmarkExercise,
): BenchmarkResult | null =>
  sortByDate(results.filter((r) => r.exercise === exercise))[0] ?? null
