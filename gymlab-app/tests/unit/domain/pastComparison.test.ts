/**
 * F139.1 — El volumen semanal de la comparación con el yo del pasado se normaliza
 * por la longitud real de cada ventana (1m = 30 d, 3m = 90 d, 6m = 180 d).
 * Antes se dividía siempre por 30, así que 3m y 6m inflaban el absoluto 3× y 6×.
 */
import { describe, expect, it } from 'vitest'
import { addLocalDays, toLocalDateStr } from '@/domain/dates'
import { buildPastComparison } from '@/domain/pastComparison'
import type { Workout } from '@/domain/types'

const now = new Date(2026, 10, 5, 12, 0, 0)
const today = toLocalDateStr(now)

const workout = (localDate: string, totalVolume: number): Workout => ({
  id: Number(localDate.replaceAll('-', '')),
  startedAt: `${localDate}T10:00:00`,
  finishedAt: `${localDate}T11:00:00`,
  localDate,
  routineId: null,
  routineDayId: null,
  notes: '',
  totalVolume,
})

describe('buildPastComparison · weeklyVolume', () => {
  it('normaliza por la ventana real en 1m, 3m y 6m', () => {
    // Un solo entreno de 3000 kg dentro de las tres ventanas actuales.
    const workouts = [workout(addLocalDays(today, -1), 3000)]
    const [one, three, six] = buildPastComparison(workouts, [], [], now)

    expect(one.current.weeklyVolume).toBe(700) // 3000 / 30 * 7
    expect(three.current.weeklyVolume).toBe(233) // 3000 / 90 * 7
    expect(six.current.weeklyVolume).toBe(117) // 3000 / 180 * 7
  })

  it('sin entrenos devuelve 0 y no divide por cero', () => {
    const [one] = buildPastComparison([], [], [], now)
    expect(one.current.weeklyVolume).toBe(0)
    expect(one.past.weeklyVolume).toBe(0)
    expect(one.deltas.volumePct).toBe(0)
  })
})
