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
  clear: () => db.activeProgram.clear(),
}
