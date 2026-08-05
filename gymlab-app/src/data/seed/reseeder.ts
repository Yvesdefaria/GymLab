import { db, SEED_VERSION } from '@/data/repositories/dexie/db'
import { seedExercises } from '@/data/seed/exercises'
import { seedRoutines, seedRoutineDays, seedRoutineItems } from '@/data/seed/routines'
import { seedPapers } from '@/data/seed/papers'
import { seedGuides } from '@/data/seed/guides'
import { profileRepo } from '@/data/repositories'
import { CUSTOM_ID_BASE } from '@/data/repositories/dexie/routineRepo'
import { withCategory } from '@/domain/exerciseCategory'
import { loadCatalog } from '@/data/catalogLoader'
import type { RoutineDay, RoutineItem } from '@/domain/types'

const preserveCustom = async () => {
  const routines = await db.routines.toArray()
  const custom = routines.filter((r) => r.id >= CUSTOM_ID_BASE || r.isCustom)
  const days: RoutineDay[] = []
  const items: RoutineItem[] = []
  for (const routine of custom) {
    const routineDays = await db.routineDays.where('routineId').equals(routine.id).toArray()
    days.push(...routineDays)
    for (const day of routineDays) {
      const dayItems = await db.routineItems.where('routineDayId').equals(day.id).toArray()
      items.push(...dayItems)
    }
  }
  return { custom, days, items }
}

export const ensureSeeded = async () => {
  const meta = await db.meta.get('seedVersion')
  const current = meta?.value

  if (current === SEED_VERSION) {
    await profileRepo.ensure()
    return
  }

  const preserved = await preserveCustom()
  const metaRows = await db.meta.toArray()
  const catalog = await loadCatalog()

  await db.transaction(
    'rw',
    [
      db.exercises,
      db.routines,
      db.routineDays,
      db.routineItems,
      db.papers,
      db.guides,
      db.meta,
      db.profile,
    ],
    async () => {
      await db.exercises.clear()
      await db.routines.clear()
      await db.routineDays.clear()
      await db.routineItems.clear()
      await db.papers.clear()
      await db.guides.clear()

      await db.exercises.bulkAdd(seedExercises.map(withCategory))
      await db.exercises.bulkAdd(catalog)
      await db.routines.bulkAdd(seedRoutines)
      await db.routineDays.bulkAdd(seedRoutineDays)
      await db.routineItems.bulkAdd(seedRoutineItems)
      await db.papers.bulkAdd(seedPapers)
      await db.guides.bulkAdd(seedGuides)

      if (preserved.custom.length > 0) {
        await db.routines.bulkAdd(preserved.custom)
        await db.routineDays.bulkAdd(preserved.days)
        await db.routineItems.bulkAdd(preserved.items)
      }

      await db.meta.bulkPut(metaRows)
      await db.meta.put({ key: 'seedVersion', value: SEED_VERSION })
    }
  )

  await profileRepo.ensure()
}
