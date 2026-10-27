// Récords personales por ejercicio y cantidad de repeticiones. La fila guarda el
// hecho (peso, reps, fecha); el e1RM se deriva al leer y nunca se persiste.
import { db } from './db'
import type { PRRepository } from '../types'
import { estimate1RM } from '@/domain/prs'
import type { PRRecord, PRRow } from '@/domain/types'

// Agrega la estimación derivada para la UI sin tocar la fila almacenada.
const withDerived = (row: PRRow): PRRecord => ({
  ...row,
  estimated1RM: estimate1RM(row.weightKg, row.reps),
})

export const prRepo: PRRepository = {
  getAll: async () => (await db.prs.toArray()).map(withDerived),
  // Mejor récord del ejercicio por e1RM: es el que muestran las tarjetas y el detalle.
  getByExercise: async (exerciseId) => {
    const rows = await db.prs.where('exerciseId').equals(exerciseId).toArray()
    if (rows.length === 0) return undefined
    return rows
      .map(withDerived)
      .reduce((best, pr) => (pr.estimated1RM > best.estimated1RM ? pr : best))
  },
  getByExerciseAndReps: async (exerciseId, reps) => {
    const row = await db.prs.where('[exerciseId+reps]').equals([exerciseId, reps]).first()
    return row ? withDerived(row) : undefined
  },
  // Ventana ISO inclusiva: los PRs se guardan con `date` ISO (set.createdAt) y el
  // índice `date` evita materializar la tabla entera en cada detalle de sesión.
  getInWindow: async (startedAt, finishedAt) =>
    (
      await db.prs.where('date').between(startedAt, finishedAt, true, true).toArray()
    ).map(withDerived),
  // Upsert por clave lógica: reutiliza el id si ya existe el par ejercicio+reps.
  upsert: async (pr) => {
    const { estimated1RM: _derived, id: _id, ...row } = pr
    const existing = await db.prs
      .where('[exerciseId+reps]')
      .equals([pr.exerciseId, pr.reps])
      .first()
    return db.prs.put(existing === undefined ? row : { ...row, id: existing.id })
  },
  deleteByExercise: (exerciseId) => db.prs.where('exerciseId').equals(exerciseId).delete(),
}
