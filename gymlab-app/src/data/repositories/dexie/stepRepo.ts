// Repositorio de pasos: registros diarios (una fila por localDate, upsert por día
// con «última escritura gana») y meta de usuario (objetivo diario y zancada).
import type { Table } from 'dexie'
import type { DailyStepsEntry } from '@/domain/types'
import { DEFAULT_STEPS_GOAL, defaultStrideFromHeight } from '@/domain/stepsTracker'
import { HEIGHT_KEY } from '@/domain/profileMeta'
import { db } from './db'
import { getByDate, nextId } from './base'
import { metaRepo } from './metaRepo'

// Claves de meta persistidas como JSON numérico en la tabla `meta`.
export const STEPS_GOAL_META_KEY = 'stepsGoal'
export const STRIDE_LENGTH_META_KEY = 'strideLengthCm'

export interface StepRepository {
  getAll(): Promise<DailyStepsEntry[]>
  getByDate(localDate: string): Promise<DailyStepsEntry | undefined>
  getRange(from: string, to: string): Promise<DailyStepsEntry[]>
  upsert(
    entry: Pick<DailyStepsEntry, 'localDate' | 'steps' | 'distanceKm' | 'calories' | 'source'>,
  ): Promise<number>
  delete(id: number): Promise<unknown>
  getGoal(): Promise<number>
  setGoal(steps: number): Promise<unknown>
  getStrideLengthCm(): Promise<number>
}

export const stepRepo: StepRepository = {
  getAll: () => db.dailySteps.orderBy('localDate').toArray(),

  getByDate: (localDate) => getByDate(db.dailySteps, localDate),

  // Rango inclusivo [from, to] para semanas y meses del contador.
  getRange: (from, to) => db.dailySteps.where('localDate').between(from, to, true, true).toArray(),

  upsert: async (entry) => {
    const syncedAt = new Date().toISOString()
    const existing = await getByDate(db.dailySteps, entry.localDate)
    if (existing) {
      // Última escritura gana: reemplaza el registro del día completo.
      await (db.dailySteps as unknown as Table<DailyStepsEntry, number>).update(existing.id, {
        ...entry,
        syncedAt,
      })
      return existing.id
    }
    const id = await nextId<DailyStepsEntry>(db.dailySteps)
    const row: DailyStepsEntry = { ...entry, id, syncedAt }
    // EntityTable.add rechaza id explícito; el cast solo evita el tipo insert.
    await (db.dailySteps as unknown as Table<DailyStepsEntry, number>).add(row)
    return id
  },

  delete: (id) => db.dailySteps.delete(id),

  getGoal: async () => {
    const stored = await metaRepo.getJson<number>(STEPS_GOAL_META_KEY, 0)
    return stored > 0 ? stored : DEFAULT_STEPS_GOAL
  },

  setGoal: (steps) => metaRepo.setJson(STEPS_GOAL_META_KEY, Math.max(1, Math.round(steps))),

  // Zancada guardada, o la estimada desde la estatura del perfil (meta) cuando
  // el usuario no la fijó; sin estatura → 70 cm.
  getStrideLengthCm: async () => {
    const stored = await metaRepo.getJson<number>(STRIDE_LENGTH_META_KEY, 0)
    if (stored > 0) return stored
    const heightCm = await metaRepo.getJson<number>(HEIGHT_KEY, 0)
    return defaultStrideFromHeight(heightCm > 0 ? heightCm : null)
  },
}