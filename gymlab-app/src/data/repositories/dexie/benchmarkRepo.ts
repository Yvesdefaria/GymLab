// Benchmark tests: resultados de tests de fuerza predefinidos.
import { db } from './db'
import { estimate1RMOrNull } from '@/domain/benchmark'
import { nextId } from './base'
import type { BenchmarkRepository } from '../types'
import type { BenchmarkResult } from '@/domain/types'

export const benchmarkRepo: BenchmarkRepository = {
  getAll: () => db.benchmarkResults.toArray(),
  getByExercise: (exercise) =>
    db.benchmarkResults.where('exercise').equals(exercise).toArray(),
  add: async (result) => {
    // Un benchmark fuera del rango fiable no se guarda con e1rm 0: se rechaza.
    const e1rm = estimate1RMOrNull(result.weightKg, result.reps)
    if (e1rm === null) {
      throw new Error('Benchmark fuera del rango fiable (1–12 reps)')
    }
    const id = await nextId(db.benchmarkResults)
    const row: BenchmarkResult = {
      ...result,
      id,
      e1rm,
      testedAt: new Date().toISOString(),
    }
    return db.benchmarkResults.add(row)
  },
}
