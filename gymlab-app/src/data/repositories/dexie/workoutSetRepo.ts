// Repositorio Dexie de series de entrenamiento y su lectura para la sesión activa.
import { db } from './db'
import { nextId } from './base'
import type { WorkoutSetRepository } from '../types'
import type { LastSetInfo } from '@/domain/session'

export const workoutSetRepo: WorkoutSetRepository = {
  getByWorkout: (workoutId) =>
    db.workoutSets.where('workoutId').equals(workoutId).toArray(),
  getByExercise: (exerciseId) =>
    db.workoutSets.where('exerciseId').equals(exerciseId).toArray(),
  // Lote por ids (índice workoutId): lee solo las series de los workouts indicados.
  getByWorkoutIds: (ids) => {
    if (ids.length === 0) return Promise.resolve([])
    return db.workoutSets.where('workoutId').anyOf(ids).toArray()
  },
  getAll: () => db.workoutSets.toArray(),
  async create(set) {
    // Id incremental manual por encima de cualquier fila existente.
    const id = await nextId(db.workoutSets)
    await db.workoutSets.add({ ...set, id })
    return id
  },
  update: (id, changes) => db.workoutSets.where('id').equals(id).modify(changes),
  delete: (id) => db.workoutSets.where('id').equals(id).delete(),
  // Última marca (peso/reps) por ejercicio: consulta indexada, sin full scan.
  async getLastSets(exerciseIds) {
    if (exerciseIds.length === 0) return new Map()
    // anyOf usa el índice exerciseId; results come in PK order (last = most recent).
    const sets = await db.workoutSets.where('exerciseId').anyOf(exerciseIds).toArray()
    const map = new Map<number, LastSetInfo>()
    for (const s of sets) {
      map.set(s.exerciseId, { weightKg: s.weightKg, reps: s.reps })
    }
    return map
  },
}
