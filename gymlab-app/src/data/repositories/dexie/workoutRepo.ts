import { db } from './db'
import type { WorkoutRepository } from '../types'

export const workoutRepo: WorkoutRepository = {
  getAll: () => db.workouts.orderBy('startedAt').reverse().toArray(),
  getById: (id) => db.workouts.where('id').equals(id).first(),
  async create(workout) {
    const last = await db.workouts.orderBy('id').last()
    const id = (last?.id ?? 0) + 1
    await db.workouts.add({ ...workout, id } as any)
    return id
  },
  update: (id, changes) => db.workouts.where('id').equals(id).modify(changes),
  delete: (id) => db.workouts.where('id').equals(id).delete(),
}
