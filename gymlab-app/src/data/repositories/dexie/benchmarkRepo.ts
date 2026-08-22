// Benchmark tests: resultados de tests de fuerza predefinidos.
import { db } from './db'
import { estimate1RM } from '@/domain/benchmark'
import { nextId } from './base'
import type { BenchmarkRepository } from '../types'
import type { BenchmarkResult } from '@/domain/types'

export const benchmarkRepo: BenchmarkRepository = {
  getAll: () => db.benchmarkResults.toArray(),
  getByExercise: (exercise) =>
    db.benchmarkResults.where('exercise').equals(exercise).toArray(),
  add: async (result) => {
    const id = await nextId(db.benchmarkResults)
    const row: BenchmarkResult = {
      ...result,
      id,
      e1rm: estimate1RM(result.weightKg, result.reps),
      testedAt: new Date().toISOString(),
    }
    return db.benchmarkResults.add(row)
  },
}
