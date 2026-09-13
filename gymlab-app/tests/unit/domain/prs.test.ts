// Tests de helpers de PRs: normalización de fecha, conteos semanales y estimación de 1RM.
import { describe, expect, it } from 'vitest'
import { prDateKey, countPrsInWeek, countPrsInWorkout, estimate1RM, bestPRFromSets } from '@/domain/prs'
import { calcBrzyckiOneRepMax } from '@/domain/calculators/oneRepMax'
import { addLocalDays, toLocalDateStr } from '@/domain/dates'
import type { PRRecord, WorkoutSet } from '@/domain/types'

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

describe('countPrsInWorkout', () => {
  const windowWorkout = {
    startedAt: '2026-08-24T10:00:00.000Z',
    finishedAt: '2026-08-24T11:00:00.000Z',
  }

  it('cuenta los PRs dentro de la ventana [startedAt, finishedAt] inclusive', () => {
    const prs = [
      makePr('2026-08-24T10:00:00.000Z'), // borde inicial
      makePr('2026-08-24T10:30:00.000Z'), // interior
      makePr('2026-08-24T11:00:00.000Z'), // borde final (PR.date == finishedAt)
    ]
    expect(countPrsInWorkout(windowWorkout, prs)).toBe(3)
  })

  it('descarta PRs fuera de la ventana (antes del inicio y tras el fin)', () => {
    const prs = [
      makePr('2026-08-24T09:59:59.000Z'),
      makePr('2026-08-24T11:00:01.000Z'),
      makePr('2026-08-25T10:00:00.000Z'),
    ]
    expect(countPrsInWorkout(windowWorkout, prs)).toBe(0)
  })

  it('devuelve 0 si el entrenamiento no está terminado (finishedAt null)', () => {
    expect(countPrsInWorkout({ startedAt: '2026-08-24T10:00:00.000Z', finishedAt: null }, [makePr('2026-08-24T10:30:00.000Z')])).toBe(0)
  })

  it('devuelve 0 sin PRs', () => {
    expect(countPrsInWorkout(windowWorkout, [])).toBe(0)
  })

  it('con dos sesiones el mismo día, un PR al final de la primera solo cuenta en la primera', () => {
    const first = { startedAt: '2026-08-24T10:00:00.000Z', finishedAt: '2026-08-24T11:00:00.000Z' }
    const second = { startedAt: '2026-08-24T11:30:00.000Z', finishedAt: '2026-08-24T12:30:00.000Z' }
    const prs = [
      makePr('2026-08-24T11:00:00.000Z'), // PR de la primera sesión
      makePr('2026-08-24T12:00:00.000Z'), // PR de la segunda sesión
    ]
    expect(countPrsInWorkout(first, prs)).toBe(1)
    expect(countPrsInWorkout(second, prs)).toBe(1)
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

// Serie de trabajo con valores por defecto válidos; cada test solo cambia lo relevante.
const makeSet = (over: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: 1,
  workoutId: 1,
  exerciseId: 7,
  setNumber: 1,
  weightKg: 100,
  reps: 5,
  completed: true,
  createdAt: '2026-09-01T10:00:00.000Z',
  ...over,
})

describe('bestPRFromSets', () => {
  it('devuelve el mejor 1RM entre las series completadas con peso', () => {
    const best = bestPRFromSets([
      makeSet({ id: 1, weightKg: 100, reps: 5 }),
      makeSet({ id: 2, weightKg: 110, reps: 3 }),
    ])
    expect(best).not.toBeNull()
    expect(best?.exerciseId).toBe(7)
    expect(best?.weightKg).toBe(110)
    expect(best?.reps).toBe(3)
    expect(best?.estimated1RM).toBe(estimate1RM(110, 3))
    expect(best?.date).toBe('2026-09-01T10:00:00.000Z')
  })

  it('cae al mejor 1RM restante cuando la serie que fijó el PR ya no está', () => {
    // PR anterior de 120; solo quedan series que estiman 110.
    const best = bestPRFromSets([makeSet({ weightKg: 110, reps: 3 })])
    expect(best?.estimated1RM).toBe(estimate1RM(110, 3))
  })

  it('devuelve null cuando no queda ninguna serie válida (fuente del PR borrada del todo)', () => {
    expect(bestPRFromSets([])).toBeNull()
    expect(
      bestPRFromSets([makeSet({ completed: false }), makeSet({ id: 2, weightKg: 0 })])
    ).toBeNull()
  })

  it('ignora las series de calentamiento: solo cuentan las de trabajo', () => {
    const best = bestPRFromSets([
      makeSet({ id: 1, weightKg: 140, reps: 2, isWarmup: true }),
      makeSet({ id: 2, weightKg: 100, reps: 5 }),
    ])
    expect(best?.weightKg).toBe(100)
  })

  it('es idempotente: recalcular sobre el mismo estado da exactamente el mismo PR', () => {
    const remaining = [
      makeSet({ id: 1, weightKg: 100, reps: 5 }),
      makeSet({ id: 2, weightKg: 105, reps: 4 }),
    ]
    expect(bestPRFromSets(remaining)).toEqual(bestPRFromSets(remaining))
  })
})