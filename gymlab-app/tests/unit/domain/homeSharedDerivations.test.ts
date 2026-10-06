// F103/T8 — derivaciones compartidas del home: los builders de dominio aceptan la
// racha y el agrupamiento de series ya resueltos por la página, para que visitar `/`
// no los recalcule una vez por widget (racha ×3, groupSetsByExercise ×2).
import { describe, expect, it } from 'vitest'
import { buildWeeklySummary } from '@/domain/weeklySummary'
import { detectPlateaus } from '@/domain/plateauDetector'
import { buildGoalProjections } from '@/domain/goalProjection'
import { addLocalDays, toLocalDateStr, weekStartKey } from '@/domain/dates'
import type { PRRecord, StreakResult, Workout, WorkoutSet } from '@/domain/types'

const NOW = new Date(2026, 8, 6, 12) // local 2026-09-06
const NOW_STR = toLocalDateStr(NOW)
const WEEK_START = weekStartKey(NOW_STR)

// Fecha local N días antes de NOW (p. ej. hace 1 día).
const ago = (daysAgo: number): string => addLocalDays(NOW_STR, -daysAgo)

const makeWorkout = (id: number, localDate: string): Workout => ({
  id,
  startedAt: `${localDate}T10:00:00.000Z`,
  finishedAt: `${localDate}T11:00:00.000Z`,
  routineId: null,
  routineDayId: null,
  localDate,
  notes: '',
  totalVolume: 1000,
})

const makeSet = (overrides: Partial<WorkoutSet> & { createdAt: string }): WorkoutSet => ({
  id: 1,
  workoutId: 1,
  exerciseId: 1,
  setNumber: 1,
  completed: true,
  isWarmup: false,
  weightKg: 100,
  reps: 5,
  ...overrides,
})

// Serie semanal constante de 10 semanas: e1rm plano → estancamiento de 12 semanas.
const plateauSets = (): WorkoutSet[] =>
  Array.from({ length: 10 }, (_, i) =>
    makeSet({ id: i + 1, createdAt: ago(1 + i * 7) })
  )

describe('buildWeeklySummary — racha compartida', () => {
  it('usa la racha ya calculada en vez de recalcularla sobre los workouts', () => {
    // Fixture con UNA sola sesión en la semana: calcStreak real daría 0 (mínimo
    // 3 sesiones/semana). El 42 solo puede venir del parámetro inyectado.
    const workouts = [makeWorkout(1, WEEK_START)]
    const prs: PRRecord[] = []
    const streak: StreakResult = { currentStreak: 42, longestStreak: 7, lastWorkoutDate: WEEK_START }

    const summary = buildWeeklySummary(workouts, prs, streak, NOW)

    expect(summary?.streakCurrent).toBe(42)
    expect(summary?.streakMax).toBe(7)
  })
})

describe('detectPlateaus — agrupamiento compartido', () => {
  it('con un agrupamiento inyectado no reconstruye el suyo (mapa vacío → sin alertas)', () => {
    const sets = plateauSets()
    // Sanity: sin inyección el fixture SÍ detecta el estancamiento.
    expect(detectPlateaus(sets, [], NOW)).toHaveLength(1)

    expect(detectPlateaus(sets, [], NOW, new Map())).toEqual([])
  })
})

describe('buildGoalProjections — agrupamiento compartido', () => {
  it('con un agrupamiento inyectado no reconstruye el suyo (mapa vacío → sin proyecciones)', () => {
    const sets = [makeSet({ createdAt: ago(1) })]
    const goals = { 1: 150 }
    // Sanity: sin inyección el fixture SÍ proyecta.
    expect(buildGoalProjections(sets, [], goals, NOW)).toHaveLength(1)

    expect(buildGoalProjections(sets, [], goals, NOW, new Map())).toEqual([])
  })
})
