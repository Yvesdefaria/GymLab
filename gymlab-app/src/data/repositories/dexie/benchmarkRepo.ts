// Benchmark tests: resultados de tests de fuerza predefinidos.
import { db } from './db'
import { estimate1RM } from '@/domain/benchmark'
import type { BenchmarkRepository } from '../types'

export const benchmarkRepo: BenchmarkRepository = {
  getAll: () => db.benchmarkResults.toArray(),
  getByExercise: (exercise) =>
    db.benchmarkResults.where('exercise').equals(exercise).toArray(),
  add: (result) =>
    db.benchmarkResults.add({
      ...result,
      e1rm: estimate1RM(result.weightKg, result.reps),
      testedAt: new Date().toISOString(),
    } as any),
}
