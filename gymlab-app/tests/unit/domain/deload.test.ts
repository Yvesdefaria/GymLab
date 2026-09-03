// Tests del dominio de la semana de deload: fecha de fin, vigencia, señal automática, score combinado y guía.
import { describe, expect, it, vi } from 'vitest'
import { deloadUntilDate, isDeloadActive, calcDeloadScore, generateDeloadGuidance, deloadSuggestedWeight, deloadDayProgress } from '@/domain/deload'
import { detectDeloadSignal } from '@/domain/progress'
import type { Workout, WorkoutSet, ActiveProgram } from '@/domain/types'

describe('deloadUntilDate', () => {
  it('devuelve hoy + 7 días en formato local YYYY-MM-DD', () => {
    const base = new Date(2026, 7, 24, 12, 0, 0) // 2026-08-24 (lunes)
    vi.useFakeTimers()
    vi.setSystemTime(base)
    expect(deloadUntilDate()).toBe('2026-08-31')
    vi.useRealTimers()
  })
})

describe('isDeloadActive', () => {
  it('inactiva sin marca activa', () => {
    expect(isDeloadActive(false, '2026-09-01')).toBe(false)
    expect(isDeloadActive(undefined, undefined)).toBe(false)
  })

  it('activa sin fecha límite (indefinida)', () => {
    expect(isDeloadActive(true, null)).toBe(true)
    expect(isDeloadActive(true, undefined)).toBe(true)
  })

  it('activa mientras la fecha límite no haya pasado (incluye el día completo)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 28, 10, 0, 0)) // dentro de la semana
    expect(isDeloadActive(true, '2026-08-31')).toBe(true)
    vi.useRealTimers()
  })

  it('inactiva cuando la fecha límite ya pasó', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 2, 10, 0, 0)) // 2026-09-02
    expect(isDeloadActive(true, '2026-08-31')).toBe(false)
    vi.useRealTimers()
  })
})

describe('detectDeloadSignal', () => {
  const workout = (startedAt: string, totalVolume: number): Workout =>
    ({
      id: Math.floor(Math.random() * 1e6),
      startedAt,
      finishedAt: startedAt,
      localDate: startedAt.slice(0, 10),
      routineId: null,
      routineDayId: null,
      totalVolume,
    }) as Workout

  it('devuelve null con menos de 2 workouts en cada ventana', () => {
    const now = new Date()
    const iso = (offsetDays: number) => {
      const d = new Date(now.getTime() + offsetDays * 86_400_000)
      return d.toISOString()
    }
    const workouts = [workout(iso(-1), 5000), workout(iso(-2), 5000)]
    expect(detectDeloadSignal(workouts)).toBeNull()
  })

  it('sugiere deload cuando el volumen medio de las últimas 3 semanas cae >=15%', () => {
    const now = new Date()
    const iso = (offsetDays: number) => {
      const d = new Date(now.getTime() + offsetDays * 86_400_000)
      return d.toISOString()
    }
    // Semanas anteriores (días -35, -28, -21): volumen alto (10000/semana).
    // Semanas recientes (días -14, -7, -1): volumen bajo (4000/semana) -> caída ~60%.
    const workouts = [
      workout(iso(-35), 30000),
      workout(iso(-28), 30000),
      workout(iso(-21), 30000),
      workout(iso(-14), 12000),
      workout(iso(-7), 12000),
      workout(iso(-1), 12000),
    ]
    const signal = detectDeloadSignal(workouts)
    expect(signal).not.toBeNull()
    expect(signal!.suggestsDeload).toBe(true)
    expect(signal!.dropPct).toBeGreaterThanOrEqual(15)
  })

  it('no sugiere deload si el volumen se mantiene', () => {
    const now = new Date()
    const iso = (offsetDays: number) => {
      const d = new Date(now.getTime() + offsetDays * 86_400_000)
      return d.toISOString()
    }
    const workouts = [
      workout(iso(-35), 10000),
      workout(iso(-28), 10000),
      workout(iso(-21), 10000),
      workout(iso(-14), 10000),
      workout(iso(-7), 10000),
      workout(iso(-1), 10000),
    ]
    const signal = detectDeloadSignal(workouts)
    expect(signal).not.toBeNull()
    expect(signal!.suggestsDeload).toBe(false)
  })

  it('devuelve null sin volumen previo', () => {
    const now = new Date()
    const iso = (offsetDays: number) => {
      const d = new Date(now.getTime() + offsetDays * 86_400_000)
      return d.toISOString()
    }
    const workouts = [workout(iso(-1), 5000), workout(iso(-2), 0), workout(iso(-3), 0)]
    expect(detectDeloadSignal(workouts)).toBeNull()
  })
})

// ── calcDeloadScore ─────────────────────────────────────────────────────────

const mkWorkout = (startedAt: string, totalVolume: number): Workout =>
  ({
    id: Math.floor(Math.random() * 1e6),
    startedAt,
    finishedAt: startedAt,
    localDate: startedAt.slice(0, 10),
    routineId: 1,
    routineDayId: 1,
    totalVolume,
  }) as Workout

const mkSet = (overrides: Partial<WorkoutSet> = {}): WorkoutSet =>
  ({
    id: 1,
    workoutId: 1,
    exerciseId: 10,
    setNumber: 1,
    weightKg: 80,
    reps: 8,
    completed: true,
    createdAt: new Date().toISOString(),
    rpe: 7,
    ...overrides,
  }) as WorkoutSet

const mkProgram = (overrides: Partial<ActiveProgram> = {}): ActiveProgram =>
  ({
    id: 1,
    routineId: 1,
    startDate: '2026-07-01',
    weekdays: [1, 3, 5],
    createdAt: '2026-07-01',
    ...overrides,
  }) as ActiveProgram

const iso = (offsetDays: number): string => {
  const d = new Date(Date.now() + offsetDays * 86_400_000)
  return d.toISOString()
}

describe('calcDeloadScore', () => {
  it('devuelve score 0 sin datos', () => {
    const score = calcDeloadScore([], [], mkProgram())
    expect(score.overall).toBe(0)
    expect(score.signals.volumeDrop).toBe(0)
    expect(score.signals.sustainedHighRpe).toBe(0)
    expect(score.signals.performanceDrop).toBe(0)
    expect(score.signals.consecutiveWeeks).toBe(0)
    expect(score.signals.programScheduled).toBe(0)
  })

  it('asigna 30 pts cuando el volumen cae ≥15%', () => {
    const workouts = [
      mkWorkout(iso(-35), 30000),
      mkWorkout(iso(-28), 30000),
      mkWorkout(iso(-21), 30000),
      mkWorkout(iso(-14), 12000),
      mkWorkout(iso(-7), 12000),
      mkWorkout(iso(-1), 12000),
    ]
    const score = calcDeloadScore(workouts, [], mkProgram())
    expect(score.signals.volumeDrop).toBe(30)
  })

  it('asigna 0 pts cuando el volumen se mantiene', () => {
    const workouts = [
      mkWorkout(iso(-35), 10000),
      mkWorkout(iso(-28), 10000),
      mkWorkout(iso(-21), 10000),
      mkWorkout(iso(-14), 10000),
      mkWorkout(iso(-7), 10000),
      mkWorkout(iso(-1), 10000),
    ]
    const score = calcDeloadScore(workouts, [], mkProgram())
    expect(score.signals.volumeDrop).toBe(0)
  })

  it('asigna 25 pts cuando RPE promedio ≥8 en la última semana', () => {
    const highRpeSets = Array.from({ length: 6 }, () =>
      mkSet({ rpe: 9, createdAt: iso(-1) })
    )
    const score = calcDeloadScore([], highRpeSets, mkProgram())
    expect(score.signals.sustainedHighRpe).toBe(25)
  })

  it('asigna 0 pts cuando RPE promedio <8', () => {
    const lowRpeSets = Array.from({ length: 6 }, () =>
      mkSet({ rpe: 6, createdAt: iso(-1) })
    )
    const score = calcDeloadScore([], lowRpeSets, mkProgram())
    expect(score.signals.sustainedHighRpe).toBe(0)
  })

  it('asigna 10 pts cuando la semana del programa coincide con deloadWeek', () => {
    const program = mkProgram({ startDate: '2026-07-06', deloadWeek: 4 }) // lunes semana 1
    // Semana 8 → 8 % 4 === 0 → coincide
    const score = calcDeloadScore([], [], program, 8)
    expect(score.signals.programScheduled).toBe(10)
  })

  it('asigna 0 pts cuando la semana del programa no coincide', () => {
    const program = mkProgram({ startDate: '2026-07-06', deloadWeek: 4 })
    const score = calcDeloadScore([], [], program, 5)
    expect(score.signals.programScheduled).toBe(0)
  })

  it('asigna 10 pts cuando la racha supera 8 semanas', () => {
    // Construye 9 semanas consecutivas (lun/mie/vie) con ≥3 sesiones c/u, terminando hace <1 semana.
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)) // lunes de esta semana
    const workouts: Workout[] = []
    for (let w = 0; w < 9; w++) {
      for (let d = 0; d < 3; d++) {
        const date = new Date(monday)
        date.setDate(monday.getDate() - w * 7 + d * 2) // lun, mié, vie
        workouts.push(mkWorkout(date.toISOString(), 10000))
      }
    }
    const score = calcDeloadScore(workouts, [], mkProgram())
    expect(score.signals.consecutiveWeeks).toBe(10)
  })

  it('asigna 0 pts cuando la racha es de 8 semanas o menos', () => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    const workouts: Workout[] = []
    for (let w = 0; w < 8; w++) {
      for (let d = 0; d < 3; d++) {
        const date = new Date(monday)
        date.setDate(monday.getDate() - w * 7 + d * 2)
        workouts.push(mkWorkout(date.toISOString(), 10000))
      }
    }
    const score = calcDeloadScore(workouts, [], mkProgram())
    expect(score.signals.consecutiveWeeks).toBe(0)
  })

  it('calcula el overall como suma de señales', () => {
    const workouts = [
      mkWorkout(iso(-35), 30000),
      mkWorkout(iso(-28), 30000),
      mkWorkout(iso(-21), 30000),
      mkWorkout(iso(-14), 12000),
      mkWorkout(iso(-7), 12000),
      mkWorkout(iso(-1), 12000),
    ]
    const highRpeSets = Array.from({ length: 6 }, () => mkSet({ rpe: 9, createdAt: iso(-1) }))
    const program = mkProgram({ startDate: '2026-07-06' })
    const score = calcDeloadScore(workouts, highRpeSets, program, 9)
    const expectedSum =
      score.signals.volumeDrop +
      score.signals.sustainedHighRpe +
      score.signals.performanceDrop +
      score.signals.consecutiveWeeks +
      score.signals.programScheduled
    expect(score.overall).toBe(expectedSum)
  })

  it('marca suggestsDeload cuando overall ≥60', () => {
    const workouts = [
      mkWorkout(iso(-35), 30000),
      mkWorkout(iso(-28), 30000),
      mkWorkout(iso(-21), 30000),
      mkWorkout(iso(-14), 12000),
      mkWorkout(iso(-7), 12000),
      mkWorkout(iso(-1), 12000),
    ]
    const highRpeSets = Array.from({ length: 6 }, () => mkSet({ rpe: 9, createdAt: iso(-1) }))
    const program = mkProgram({ startDate: '2026-07-06', deloadWeek: 4 })
    const score = calcDeloadScore(workouts, highRpeSets, program, 8)
    // volumeDrop=30 + sustainedHighRpe=25 + programScheduled=10 = 65 ≥ 60
    expect(score.suggestsDeload).toBe(true)
  })

  it('no sugiere deload cuando overall <60', () => {
    const workouts = [
      mkWorkout(iso(-35), 10000),
      mkWorkout(iso(-28), 10000),
      mkWorkout(iso(-21), 10000),
      mkWorkout(iso(-14), 10000),
      mkWorkout(iso(-7), 10000),
      mkWorkout(iso(-1), 10000),
    ]
    const lowRpeSets = Array.from({ length: 6 }, () => mkSet({ rpe: 5, createdAt: iso(-1) }))
    const score = calcDeloadScore(workouts, lowRpeSets, mkProgram())
    expect(score.suggestsDeload).toBe(false)
  })
})

// ── generateDeloadGuidance ──────────────────────────────────────────────────

describe('generateDeloadGuidance', () => {
  it('reduce el peso 10% por defecto', () => {
    const sets = [mkSet({ weightKg: 100 })]
    const guidance = generateDeloadGuidance(sets)
    expect(guidance[0].suggestedWeightKg).toBe(90)
    expect(guidance[0].reductionPct).toBe(10)
  })

  it('mantiene el peso para ejercicios de peso corporal (0 kg)', () => {
    const sets = [mkSet({ weightKg: 0 })]
    const guidance = generateDeloadGuidance(sets)
    expect(guidance[0].suggestedWeightKg).toBe(0)
  })

  it('redondea a 0.5 kg', () => {
    const sets = [mkSet({ weightKg: 87 })]
    const guidance = generateDeloadGuidance(sets)
    expect(guidance[0].suggestedWeightKg).toBe(78.5)
  })

  it('retorna array vacío sin sets', () => {
    expect(generateDeloadGuidance([])).toEqual([])
  })

  it('aplica reducción personalizada', () => {
    const sets = [mkSet({ weightKg: 100 })]
    const guidance = generateDeloadGuidance(sets, 15)
    expect(guidance[0].suggestedWeightKg).toBe(85)
    expect(guidance[0].reductionPct).toBe(15)
  })
})

// ── deloadSuggestedWeight ───────────────────────────────────────────────────

describe('deloadSuggestedWeight', () => {
  it('reduce un 10% por defecto redondeando a 0.5', () => {
    expect(deloadSuggestedWeight(100)).toBe(90)
    expect(deloadSuggestedWeight(87)).toBe(78.5)
  })

  it('devuelve 0 para peso corporal (0 kg)', () => {
    expect(deloadSuggestedWeight(0)).toBe(0)
  })

  it('aplica reducción personalizada', () => {
    expect(deloadSuggestedWeight(100, 15)).toBe(85)
  })
})

// ── deloadDayProgress ───────────────────────────────────────────────────────

describe('deloadDayProgress', () => {
  it('devuelve el día transcurrido dentro de la semana de deload', () => {
    // Until = hoy + 7 días → día 1 (recién activada).
    const until = deloadUntilDate()
    expect(deloadDayProgress(until)).toBe(1)
  })
})