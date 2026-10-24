// Resúmenes puros de Cuerpo y progreso: peso por rango, delta entre fechas,
// conteo de fatiga y orden de fotos. Sin React ni Dexie.
import { describe, expect, it } from 'vitest'
import {
  countPhotoAngles,
  fatigueCounts,
  sortPhotosByDateDesc,
  weightDeltaBetween,
  weightSummary,
} from '@/domain/bodyProgress'
import type { BodyWeightEntry, ProgressPhotoEntry } from '@/domain/types'

// 2026-10-24 12:00 local; los tests no dependen del reloj real.
const NOW = new Date('2026-10-24T12:00:00').getTime()
const DAY = 86_400_000

const weight = (localDate: string, weightKg: number): BodyWeightEntry => ({
  id: Number(localDate.replaceAll('-', '')),
  localDate,
  weightKg,
  createdAt: `${localDate}T09:00:00.000Z`,
})

const photo = (localDate: string, angles = 1): ProgressPhotoEntry => ({
  id: Number(localDate.replaceAll('-', '')),
  localDate,
  frontUri: angles > 0 ? 'front' : null,
  sideUri: angles > 1 ? 'side' : null,
  backUri: angles > 2 ? 'back' : null,
  createdAt: `${localDate}T09:00:00.000Z`,
})

describe('weightSummary', () => {
  it('sin registros devuelve un resumen vacío', () => {
    expect(weightSummary([], 30, NOW)).toEqual({
      latest: null,
      deltaKg: null,
      minKg: null,
      maxKg: null,
      count: 0,
    })
  })

  it('con un solo registro no inventa delta', () => {
    const summary = weightSummary([weight('2026-10-24', 78.4)], 30, NOW)
    expect(summary.latest?.weightKg).toBe(78.4)
    expect(summary.deltaKg).toBeNull()
    expect(summary.minKg).toBe(78.4)
    expect(summary.maxKg).toBe(78.4)
    expect(summary.count).toBe(1)
  })

  it('calcula delta, mínimo y máximo dentro del rango', () => {
    const summary = weightSummary(
      [
        weight('2026-10-01', 80.2),
        weight('2026-10-10', 79.1),
        weight('2026-10-24', 78.4),
      ],
      30,
      NOW,
    )
    expect(summary.latest?.localDate).toBe('2026-10-24')
    expect(summary.deltaKg).toBeCloseTo(-1.8)
    expect(summary.minKg).toBe(78.4)
    expect(summary.maxKg).toBe(80.2)
    expect(summary.count).toBe(3)
  })

  it('filtra por 30, 90 y Todo', () => {
    const entries = [
      weight('2026-07-01', 84),
      weight('2026-08-20', 82),
      weight('2026-10-10', 79),
      weight('2026-10-24', 78),
    ]
    expect(weightSummary(entries, 30, NOW).count).toBe(2)
    expect(weightSummary(entries, 90, NOW).count).toBe(3)
    expect(weightSummary(entries, 0, NOW).count).toBe(4)
  })

  it('si el rango no tiene registros, no usa el último global', () => {
    const summary = weightSummary([weight('2026-01-01', 90)], 30, NOW)
    expect(summary.latest).toBeNull()
    expect(summary.count).toBe(0)
  })

  it('ordena por fecha aunque la entrada venga desordenada', () => {
    const summary = weightSummary(
      [weight('2026-10-24', 78), weight('2026-10-01', 80), weight('2026-10-10', 79)],
      30,
      NOW,
    )
    expect(summary.latest?.localDate).toBe('2026-10-24')
    expect(summary.deltaKg).toBe(-2)
  })

  it('no muta el array de entrada', () => {
    const entries = [weight('2026-10-24', 78), weight('2026-10-01', 80)]
    weightSummary(entries, 30, NOW)
    expect(entries[0].localDate).toBe('2026-10-24')
  })

  it('acepta límites exactos del rango', () => {
    const edge = new Date(NOW - 30 * DAY).toISOString().slice(0, 10)
    expect(weightSummary([weight(edge, 80), weight('2026-10-24', 78)], 30, NOW).count).toBe(2)
  })
})

describe('weightDeltaBetween', () => {
  const entries = [weight('2026-09-24', 80.5), weight('2026-10-24', 78.4)]

  it('devuelve los dos pesos y el delta B - A', () => {
    expect(weightDeltaBetween(entries, '2026-09-24', '2026-10-24')).toEqual({
      fromKg: 80.5,
      toKg: 78.4,
      deltaKg: -2.1,
    })
  })

  it('devuelve null si falta una de las fechas', () => {
    expect(weightDeltaBetween(entries, '2026-09-24', '2026-10-01')).toBeNull()
    expect(weightDeltaBetween(entries, '2026-09-01', '2026-10-24')).toBeNull()
  })

  it('mantiene el signo si B pesa más que A', () => {
    expect(weightDeltaBetween(entries, '2026-10-24', '2026-09-24')?.deltaKg).toBeCloseTo(2.1)
  })
})

describe('fatigueCounts', () => {
  it('sin datos cuenta los 10 grupos como noData', () => {
    expect(fatigueCounts({})).toEqual({
      fresh: 0,
      warm: 0,
      fatigued: 0,
      sore: 0,
      noData: 10,
    })
  })

  it('cuenta cada nivel y deja el resto en noData', () => {
    expect(
      fatigueCounts({ pecho: 'fatigued', espalda: 'fresh', pierna: 'sore', biceps: 'warm' }),
    ).toEqual({
      fresh: 1,
      warm: 1,
      fatigued: 1,
      sore: 1,
      noData: 6,
    })
  })

  it('todos recuperados no deja noData', () => {
    const all = {
      pecho: 'fresh',
      espalda: 'fresh',
      biceps: 'fresh',
      triceps: 'fresh',
      hombro: 'fresh',
      pierna: 'fresh',
      gluteo: 'fresh',
      abdomen: 'fresh',
      trapecios: 'fresh',
      antebrazo: 'fresh',
    } as const
    expect(fatigueCounts(all)).toMatchObject({ fresh: 10, noData: 0 })
  })
})

describe('sortPhotosByDateDesc y countPhotoAngles', () => {
  it('ordena las fotos de más reciente a más vieja sin mutar', () => {
    const photos = [photo('2026-09-01'), photo('2026-10-24'), photo('2026-10-01')]
    expect(sortPhotosByDateDesc(photos).map((p) => p.localDate)).toEqual([
      '2026-10-24',
      '2026-10-01',
      '2026-09-01',
    ])
    expect(photos[0].localDate).toBe('2026-09-01')
  })

  it('cuenta los ángulos presentes de una fecha', () => {
    expect(countPhotoAngles(photo('2026-10-24', 0))).toBe(0)
    expect(countPhotoAngles(photo('2026-10-24', 1))).toBe(1)
    expect(countPhotoAngles(photo('2026-10-24', 2))).toBe(2)
    expect(countPhotoAngles(photo('2026-10-24', 3))).toBe(3)
  })
})
