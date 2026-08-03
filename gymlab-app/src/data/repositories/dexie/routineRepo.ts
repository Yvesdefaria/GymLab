import { db } from './db'
import type { RoutineRepository, RoutineDraft } from '../types'

export const CUSTOM_ID_BASE = 10000

const nextCustomId = async (getLast: () => Promise<{ id: number } | undefined>) => {
  const last = await getLast()
  return Math.max(CUSTOM_ID_BASE, (last?.id ?? CUSTOM_ID_BASE - 1) + 1)
}

const addDaysAndItems = async (
  routineId: number,
  days: RoutineDraft['days']
) => {
  let dayId = await nextCustomId(() => db.routineDays.orderBy('id').last())
  let itemId = await nextCustomId(() => db.routineItems.orderBy('id').last())
  for (let di = 0; di < days.length; di++) {
    const day = days[di]
    await db.routineDays.add({ id: dayId, routineId, dayIndex: di, name: day.name })
    for (const item of day.items) {
      await db.routineItems.add({
        id: itemId++,
        routineDayId: dayId,
        exerciseId: item.exerciseId,
        targetSets: item.targetSets,
        targetReps: item.targetReps,
        restSec: item.restSec,
        order: item.order,
      })
    }
    dayId++
  }
}

const removeDaysAndItems = async (routineId: number) => {
  const days = await db.routineDays.where('routineId').equals(routineId).toArray()
  for (const day of days) {
    await db.routineItems.where('routineDayId').equals(day.id).delete()
  }
  await db.routineDays.where('routineId').equals(routineId).delete()
}

export const routineRepo: RoutineRepository = {
  getAll: () => db.routines.toArray(),
  getBySlug: (slug) => db.routines.where('slug').equals(slug).first(),
  getDays: (routineId) =>
    db.routineDays.where('routineId').equals(routineId).toArray(),
  getItems: (routineDayId) =>
    db.routineItems.where('routineDayId').equals(routineDayId).sortBy('order'),

  async createRoutine(draft) {
    const routineId = await nextCustomId(() => db.routines.orderBy('id').last())
    await db.transaction('rw', [db.routines, db.routineDays, db.routineItems], async () => {
      await db.routines.add({
        id: routineId,
        slug: draft.slug,
        title: draft.title,
        objective: draft.objective,
        level: draft.level,
        description: draft.description,
        daysCount: draft.days.length,
        isCustom: true,
      })
      await addDaysAndItems(routineId, draft.days)
    })
    return routineId
  },

  async updateRoutine(id, draft) {
    await db.transaction('rw', [db.routines, db.routineDays, db.routineItems], async () => {
      await db.routines.update(id, {
        slug: draft.slug,
        title: draft.title,
        objective: draft.objective,
        level: draft.level,
        description: draft.description,
        daysCount: draft.days.length,
      })
      await removeDaysAndItems(id)
      await addDaysAndItems(id, draft.days)
    })
  },

  async deleteRoutine(id) {
    await db.transaction('rw', [db.routines, db.routineDays, db.routineItems], async () => {
      await removeDaysAndItems(id)
      await db.routines.delete(id)
    })
  },
}
