import { db } from './db'
import type { WorkoutSetRepository } from '../types'
import type { LastSetInfo } from '@/domain/session'

export const workoutSetRepo: WorkoutSetRepository = {
  getByWorkout: (workoutId) =>
    db.workoutSets.where('workoutId').equals(workoutId).toArray(),
  getAll: () => db.workoutSets.toArray(),
  create: (set) => db.workoutSets.add(set as any),
  update: (id, changes) => db.workoutSets.where('id').equals(id).modify(changes),
  delete: (id) => db.workoutSets.where('id').equals(id).delete(),
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
