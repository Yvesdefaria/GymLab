import { useLiveQuery } from 'dexie-react-hooks'
import { supplementRepo } from '@/data/repositories'
import { SUPPLEMENT_SEED } from '@/domain/supplements'
import { db } from '@/data/repositories/dexie/db'

// Seeds supplements into Dexie if the table is empty.
const seedIfNeeded = async () => {
  const count = await db.supplements.count()
  if (count === 0) {
    const { nextId } = await import('@/data/repositories/dexie/base')
    for (const s of SUPPLEMENT_SEED) {
      const id = await nextId(db.supplements)
      await db.supplements.add({ ...s, id, createdAt: new Date().toISOString() })
    }
  }
}

// Ensures seed runs once on first call.
let seeded = false
const ensureSeeded = async () => {
  if (!seeded) {
    await seedIfNeeded()
    seeded = true
  }
}

export const useSupplements = () => {
  const supplements = useLiveQuery(async () => {
    await ensureSeeded()
    return supplementRepo.getAll()
  }, []) ?? []
  return { supplements, supplementRepo }
}
