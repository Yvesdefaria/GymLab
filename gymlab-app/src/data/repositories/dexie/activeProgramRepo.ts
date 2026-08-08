// Implementación Dexie del programa activo: siempre una única fila (id fijo).
// La UI no accede a db directamente, solo a este repositorio.
import { db } from './db'
import type { ActiveProgramRepository } from '../types'

export const activeProgramRepo: ActiveProgramRepository = {
  get: async () => {
    // El programa activo vive en una sola fila de la tabla.
    const rows = await db.activeProgram.toArray()
    return rows[0]
  },
  set: async (program) => {
    // Se reemplaza el programa anterior; id fijo para que solo exista uno.
    await db.activeProgram.clear()
    return db.activeProgram.add({ ...program, id: 1 } as any)
  },
  setDeload: async (deloadActive, deloadUntil = null) => {
    // Solo aplica sobre la fila actual; si no hay programa, no hace nada.
    const current = await db.activeProgram.toArray().then((rows) => rows[0])
    if (!current) return
    await db.activeProgram.update(current.id, { deloadActive, deloadUntil })
  },
  clear: () => db.activeProgram.clear(),
}
