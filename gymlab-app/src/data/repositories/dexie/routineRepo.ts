// Repositorio Dexie de rutinas: catálogo seed (ids < 10000) y rutinas
// personalizadas (ids >= CUSTOM_ID_BASE) con sus días y ejercicios.
import type { EntityTable } from 'dexie'
import { db } from './db'
import { getBySlug, nextId } from './base'
import type { RoutineRepository, RoutineDraft } from '../types'

// Los ids de rutinas/días personalizadas empiezan en 10000 para no chocar con el seed.
export const CUSTOM_ID_BASE = 10000

// Siguiente id personalizado, sin bajar de CUSTOM_ID_BASE (los seeds usan ids bajos).
const nextCustomId = async <T extends { id: number }>(table: EntityTable<T, 'id'>) =>
  Math.max(CUSTOM_ID_BASE, await nextId(table))

// Inserta los días y sus ítems de una rutina con ids personalizados correlativos.
const addDaysAndItems = async (
  routineId: number,
  days: RoutineDraft['days']
) => {
  let dayId = await nextCustomId(db.routineDays)
  let itemId = await nextCustomId(db.routineItems)
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
        supersetGroup: item.supersetGroup,
        notes: item.notes,
      })
    }
    dayId++
  }
}

// Borra los días e ítems de una rutina (cascada manual).
const removeDaysAndItems = async (routineId: number) => {
  const days = await db.routineDays.where('routineId').equals(routineId).toArray()
  for (const day of days) {
    await db.routineItems.where('routineDayId').equals(day.id).delete()
  }
  await db.routineDays.where('routineId').equals(routineId).delete()
}

export const routineRepo: RoutineRepository = {
  getAll: () => db.routines.toArray(),
  getBySlug: (slug) => getBySlug(db.routines, slug),
  getDays: (routineId) =>
    db.routineDays.where('routineId').equals(routineId).toArray(),
  getItems: (routineDayId) =>
    db.routineItems.where('routineDayId').equals(routineDayId).sortBy('order'),

  // Crea rutina + días + ítems en una transacción para que sea atómica.
  async createRoutine(draft) {
    const routineId = await nextCustomId(db.routines)
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

  // Actualiza cabecera y reconstruye días/ítems (borra y reinserta).
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

  // Elimina rutina con sus días e ítems de forma atómica.
  async deleteRoutine(id) {
    await db.transaction('rw', [db.routines, db.routineDays, db.routineItems], async () => {
      await removeDaysAndItems(id)
      await db.routines.delete(id)
    })
  },
}
