import { db } from './db'
import type { RoutineRepository } from '../types'

export const routineRepo: RoutineRepository = {
  getAll: () => db.routines.toArray(),
  getBySlug: (slug) => db.routines.where('slug').equals(slug).first(),
  getDays: (routineId) =>
    db.routineDays.where('routineId').equals(routineId).toArray(),
  getItems: (routineDayId) =>
    db.routineItems.where('routineDayId').equals(routineDayId).sortBy('order'),
}
