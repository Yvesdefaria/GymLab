import { db } from './db'
import type { ActiveProgramRepository } from '../types'

export const activeProgramRepo: ActiveProgramRepository = {
  get: async () => {
    const rows = await db.activeProgram.toArray()
    return rows[0]
  },
  set: async (program) => {
    await db.activeProgram.clear()
    return db.activeProgram.add({ ...program, id: 1 } as any)
  },
  setDeload: async (deloadActive, deloadUntil = null) => {
    const current = await db.activeProgram.toArray().then((rows) => rows[0])
    if (!current) return
    await db.activeProgram.update(current.id, { deloadActive, deloadUntil })
  },
  clear: () => db.activeProgram.clear(),
}
