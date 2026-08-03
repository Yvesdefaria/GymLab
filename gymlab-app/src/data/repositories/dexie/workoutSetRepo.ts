import { db } from './db'
import type { WorkoutSetRepository } from '../types'

export const workoutSetRepo: WorkoutSetRepository = {
  getByWorkout: (workoutId) =>
    db.workoutSets.where('workoutId').equals(workoutId).toArray(),
  create: (set) => db.workoutSets.add(set as any),
  update: (id, changes) => db.workoutSets.where('id').equals(id).modify(changes),
  delete: (id) => db.workoutSets.where('id').equals(id).delete(),
}
