// Repositorio Dexie de series de entrenamiento y su lectura para la sesión activa.
import { db } from './db'
import type { WorkoutSetRepository } from '../types'
import type { LastSetInfo } from '@/domain/session'

export const workoutSetRepo: WorkoutSetRepository = {
  getByWorkout: (workoutId) =>
    db.workoutSets.where('workoutId').equals(workoutId).toArray(),
  getByExercise: (exerciseId) =>
    db.workoutSets.where('exerciseId').equals(exerciseId).toArray(),
  getAll: () => db.workoutSets.toArray(),
  async create(set) {
    // Id incremental manual por encima de cualquier fila existente.
    const last = await db.workoutSets.orderBy('id').last()
    const id = (last?.id ?? 0) + 1
    await db.workoutSets.add({ ...set, id } as any)
    return id
  },
  update: (id, changes) => db.workoutSets.where('id').equals(id).modify(changes),
  delete: (id) => db.workoutSets.where('id').equals(id).delete(),
  // Última marca (peso/reps) por ejercicio: escaneo lineal, vale para pocos ids.
  async getLastSets(exerciseIds) {
    const wanted = new Set(exerciseIds)
    if (wanted.size === 0) return new Map()
    const sets = await db.workoutSets.toArray()
    const map = new Map<number, LastSetInfo>()
    for (const s of sets) {
      if (wanted.has(s.exerciseId)) {
        map.set(s.exerciseId, { weightKg: s.weightKg, reps: s.reps })
      }
    }
    return map
  },
}
