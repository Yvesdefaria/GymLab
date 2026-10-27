// Benchmark tests: test de fuerza predefinidos con tracking de mejora.
// La estimación de 1RM se delega en el motor de PRs para que benchmark y récords
// hablen el mismo idioma (misma fórmula, mismo cap de reps, mismo redondeo).
import type { BenchmarkResult } from './types'
import { estimate1RM as estimate1RMFromPrs, estimate1RMValue } from './prs'

export type BenchmarkExercise = 'sentadilla' | 'banca' | 'peso_muerto' | 'press_militar'

// Estima 1RM usando la fórmula de Brzycki (fuente única: domain/prs.ts).
export const estimate1RM = estimate1RMFromPrs

// Variante estricta para persistencia: null cuando el set no permite estimar.
export const estimate1RMOrNull = estimate1RMValue

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
