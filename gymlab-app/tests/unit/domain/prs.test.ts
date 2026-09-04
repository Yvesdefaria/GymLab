// Tests de helpers de PRs: normalización de fecha, conteos semanales y estimación de 1RM.
import { describe, expect, it } from 'vitest'
import { prDateKey, countPrsInWeek, estimate1RM } from '@/domain/prs'
import { calcBrzyckiOneRepMax } from '@/domain/calculators/oneRepMax'
import { addLocalDays, toLocalDateStr } from '@/domain/dates'
import type { PRRecord } from '@/domain/types'

const makePr = (date: string, exerciseId = 1): PRRecord => ({
  exerciseId,
  weightKg: 100,
  reps: 2,
  date,
  estimated1RM: 105,
})

describe('prDateKey', () => {
  it('deja intacta una fecha de solo día', () => {
    expect(prDateKey('2026-08-28')).toBe('2026-08-28')
  })

  it('normaliza un ISO con hora a día local YYYY-MM-DD', () => {
    const iso = '2026-08-28T21:30:00.000Z'
    expect(prDateKey(iso)).toBe(toLocalDateStr(new Date(iso)))
  })
})

describe('countPrsInWeek', () => {
  it('cuenta los PRs de la semana de `now` y descarta los de semanas previas', () => {
    const now = new Date('2026-08-28T12:00:00')
    const todayKey = toLocalDateStr(now)
    const prs = [
      makePr(todayKey),
      makePr(addLocalDays(todayKey, -1)),
      makePr(addLocalDays(todayKey, -10)),
    ]
    expect(countPrsInWeek(prs, now)).toBe(2)
  })

  it('devuelve 0 sin PRs', () => {
    expect(countPrsInWeek([], new Date('2026-08-28T12:00:00'))).toBe(0)
  })
})

describe('estimate1RM', () => {
  it('devuelve el propio peso con 1 repetición', () => {
    expect(estimate1RM(100, 1)).toBe(100)
  })

  it('aplica Brzycki redondeando a 1 decimal', () => {
    // 100 × 36/32 = 112.5
    expect(estimate1RM(100, 5)).toBe(112.5)
    // 100 × 36/27 = 133.33 → 133.3
    expect(estimate1RM(100, 10)).toBe(133.3)
  })

  it('devuelve 0 con inputs no válidos', () => {
    expect(estimate1RM(0, 5)).toBe(0)
    expect(estimate1RM(-100, 5)).toBe(0)
    expect(estimate1RM(100, 0)).toBe(0)
  })

  it('no explota con reps >= 37 (límite inferior de la fórmula Brzycki)', () => {
    expect(estimate1RM(100, 37)).toBe(0)
    expect(estimate1RM(100, 40)).toBe(0)
    expect(estimate1RM(100, 1000)).toBe(0)
  })
})

describe('coherencia estimate1RM ↔ calcBrzyckiOneRepMax', () => {
  // La calculadora debe reutilizar la misma fuente de verdad que el motor de PRs:
  // el mismo input debe dar exactamente el mismo resultado en ambos.
  const inputs: Array<[number, number]> = [
    [80, 1],
    [92, 6],
    [100, 5],
    [100, 10],
    [120, 3],
    [60, 12],
    [100, 37],
    [100, 40],
  ]

  for (const [peso, reps] of inputs) {
    it(`coincide para ${peso} kg × ${reps} reps`, () => {
      expect(calcBrzyckiOneRepMax(peso, reps)).toBe(estimate1RM(peso, reps))
    })
  }
})