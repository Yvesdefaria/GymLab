// Tests de helpers de PRs: normalización de fecha, conteos semanales y estimación de 1RM.
import { describe, expect, it } from 'vitest'
import {
  MAX_E1RM_REPS,
  bestPRsFromSets,
  countPrsInWeek,
  countPrsInWorkout,
  detectPRsFromSets,
  estimate1RM,
  estimate1RMValue,
  isPR,
  prDateKey,
} from '@/domain/prs'
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

describe('cap de repeticiones de Brzycki', () => {
  it('acepta hasta 12 reps', () => {
    expect(MAX_E1RM_REPS).toBe(12)
    expect(estimate1RM(100, 12)).toBe(144)
  })

  it('rechaza 13+ reps: sin estimación', () => {
    expect(estimate1RM(100, 13)).toBe(0)
    expect(estimate1RM(100, 20)).toBe(0)
    expect(estimate1RM(100, 36)).toBe(0)
  })

  it('estimate1RMValue devuelve null fuera de rango', () => {
    expect(estimate1RMValue(100, 12)).toBe(144)
    expect(estimate1RMValue(100, 13)).toBeNull()
    expect(estimate1RMValue(100, 36)).toBeNull()
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

describe('detectPRsFromSets', () => {
  it('ignora los calentamientos: no generan PR', () => {
    const warmup = makeSet({ id: 1, weightKg: 40, reps: 20, isWarmup: true })
    const work = makeSet({ id: 2, weightKg: 60, reps: 5 })
    const prs = detectPRsFromSets([warmup, work], [])
    expect(prs).toHaveLength(1)
    expect(prs[0]).toMatchObject({ exerciseId: 7, weightKg: 60, reps: 5 })
  })

  it('ignora series con 0 reps', () => {
    expect(detectPRsFromSets([makeSet({ weightKg: 50, reps: 0 })], [])).toHaveLength(0)
  })

  it('ignora series fuera del rango fiable de Brzycki', () => {
    expect(detectPRsFromSets([makeSet({ weightKg: 20, reps: 20 })], [])).toHaveLength(0)
  })

  it('un récord por cada cantidad de reps (1, 3, 5 y 12)', () => {
    const prs = detectPRsFromSets(
      [
        makeSet({ id: 1, weightKg: 100, reps: 1 }),
        makeSet({ id: 2, weightKg: 80, reps: 3 }),
        makeSet({ id: 3, weightKg: 60, reps: 5 }),
        makeSet({ id: 4, weightKg: 60, reps: 12 }),
      ],
      []
    )
    expect(prs).toHaveLength(4)
    expect(prs.find((pr) => pr.reps === 1)?.weightKg).toBe(100)
    expect(prs.find((pr) => pr.reps === 3)?.weightKg).toBe(80)
    expect(prs.find((pr) => pr.reps === 5)?.weightKg).toBe(60)
    expect(prs.find((pr) => pr.reps === 12)?.weightKg).toBe(60)
  })

  it('registra el PR de trabajo cuando hay warmup y trabajo', () => {
    const prs = detectPRsFromSets(
      [
        makeSet({ id: 1, weightKg: 40, reps: 20, isWarmup: true }),
        makeSet({ id: 2, weightKg: 60, reps: 5 }),
      ],
      []
    )
    expect(prs[0]?.estimated1RM).toBe(estimate1RM(60, 5))
  })

  it('solo supera el récord si sube el peso para la misma cantidad de reps', () => {
    const existing: PRRecord = {
      exerciseId: 7,
      weightKg: 100,
      reps: 5,
      date: '2026-08-01T10:00:00.000Z',
      estimated1RM: estimate1RM(100, 5),
    }
    expect(detectPRsFromSets([makeSet({ weightKg: 100, reps: 5 })], [existing])).toHaveLength(0)
    expect(detectPRsFromSets([makeSet({ weightKg: 95, reps: 5 })], [existing])).toHaveLength(0)
    expect(detectPRsFromSets([makeSet({ weightKg: 102.5, reps: 5 })], [existing])).toHaveLength(1)
  })
})

describe('isPR', () => {
  it('devuelve false con un set inválido', () => {
    expect(isPR(100, 0, undefined)).toBe(false)
    expect(isPR(0, 5, undefined)).toBe(false)
    expect(isPR(100, 20, undefined)).toBe(false)
  })

  it('devuelve false para un calentamiento', () => {
    expect(isPR(100, 5, undefined, true)).toBe(false)
  })

  it('devuelve true con un set válido sin PR previo', () => {
    expect(isPR(100, 5, undefined)).toBe(true)
  })

  it('compara el peso contra el récord del mismo ejercicio y reps', () => {
    const pr = { weightKg: 100 }
    expect(isPR(100, 5, pr)).toBe(false)
    expect(isPR(102.5, 5, pr)).toBe(true)
  })
})

describe('bestPRsFromSets', () => {
  it('devuelve el mejor peso por cantidad de reps', () => {
    const best = bestPRsFromSets([
      makeSet({ id: 1, weightKg: 100, reps: 5 }),
      makeSet({ id: 2, weightKg: 110, reps: 3 }),
    ])
    expect(best).toHaveLength(2)
    expect(best.find((pr) => pr.reps === 5)?.weightKg).toBe(100)
    expect(best.find((pr) => pr.reps === 3)?.weightKg).toBe(110)
    expect(best.find((pr) => pr.reps === 3)?.estimated1RM).toBe(estimate1RM(110, 3))
  })

  it('cae al mejor restante cuando la serie que fijó el PR ya no está', () => {
    const best = bestPRsFromSets([makeSet({ weightKg: 110, reps: 3 })])
    expect(best).toHaveLength(1)
    expect(best[0]?.estimated1RM).toBe(estimate1RM(110, 3))
  })

  it('devuelve una lista vacía cuando no queda ninguna serie válida', () => {
    expect(bestPRsFromSets([])).toEqual([])
    expect(
      bestPRsFromSets([makeSet({ completed: false }), makeSet({ id: 2, weightKg: 0 })])
    ).toEqual([])
  })

  it('ignora las series de calentamiento: solo cuentan las de trabajo', () => {
    const best = bestPRsFromSets([
      makeSet({ id: 1, weightKg: 140, reps: 2, isWarmup: true }),
      makeSet({ id: 2, weightKg: 100, reps: 5 }),
    ])
    expect(best).toHaveLength(1)
    expect(best[0]?.weightKg).toBe(100)
  })

  it('es idempotente: recalcular sobre el mismo estado da exactamente los mismos récords', () => {
    const remaining = [
      makeSet({ id: 1, weightKg: 100, reps: 5 }),
      makeSet({ id: 2, weightKg: 105, reps: 4 }),
    ]
    expect(bestPRsFromSets(remaining)).toEqual(bestPRsFromSets(remaining))
  })
})