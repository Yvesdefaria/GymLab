import { db } from './db'
import type { WorkoutRepository } from '../types'

export const workoutRepo: WorkoutRepository = {
  getAll: () => db.workouts.orderBy('startedAt').reverse().toArray(),
  getById: (id) => db.workouts.where('id').equals(id).first(),
  create: (workout) => db.workouts.add(workout as any),
  update: (id, changes) => db.workouts.where('id').equals(id).modify(changes),
  delete: (id) => db.workouts.where('id').equals(id).delete(),
}
