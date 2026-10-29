// Tests de proyección de objetivos (goalProjection): tasa semanal de mejora,
// fecha estimada, estado «alcanzado» y casos sin datos recientes.
import { describe, expect, it } from 'vitest'
import { buildGoalProjections, buildGoalRows, goalProgressRatio, isEveryGoalReached, pickFeaturedGoal, type GoalProjection } from '@/domain/goalProjection'
import type { WorkoutSet } from '@/domain/types'
import { addLocalDays } from '@/domain/dates'

const NOW = new Date(2026, 8, 6, 12) // local 2026-09-06
const NOW_STR = '2026-09-06'

// Fecha local N días antes de NOW (p. ej. hace 1 día = 2026-09-05).
const ago = (daysAgo: number): string => addLocalDays(NOW_STR, -daysAgo)

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

const EXERCISES = [
  { id: 1, name: 'Press de pecho con barra' },
  { id: 2, name: 'Peso muerto' },
]

describe('buildGoalProjections', () => {
  it('devuelve [] sin objetivos configurados', () => {
    const sets = [makeSet({ createdAt: ago(1) })]
    expect(buildGoalProjections(sets, EXERCISES, {}, NOW)).toEqual([])
  })

  it('ignora el ejercicio sin datos en los últimos 28 días', () => {
    const sets = [makeSet({ id: 1, createdAt: ago(60) })] // fuera de la ventana
    expect(buildGoalProjections(sets, EXERCISES, { 1: 150 }, NOW)).toEqual([])
  })

  it('ignora objetivos inválidos o no positivos', () => {
    const sets = [makeSet({ id: 1, createdAt: ago(1) })]
    expect(buildGoalProjections(sets, EXERCISES, { 1: 0 }, NOW)).toEqual([])
    expect(buildGoalProjections(sets, EXERCISES, { 0: 150 }, NOW)).toEqual([])
  })

  it('marca como alcanzado cuando el e1rm actual ya supera el objetivo', () => {
    const sets = [makeSet({ id: 1, weightKg: 160, reps: 1, createdAt: ago(1) })]
    const [p] = buildGoalProjections(sets, EXERCISES, { 1: 150 }, NOW)
    expect(p).toMatchObject({
      exerciseId: 1,
      exerciseName: 'Press de pecho con barra',
      currentE1rm: 160,
      targetE1rm: 150,
      reached: true,
      weeklyImprovementRate: 0,
      weeksToTarget: 0,
    })
    expect(p.estimatedDate).toBeNull()
  })

  it('usa tasa por defecto 0.5 kg/semana cuando falta historial semanal', () => {
    const sets = [makeSet({ id: 1, weightKg: 100, reps: 5, createdAt: ago(1) })]
    const [p] = buildGoalProjections(sets, EXERCISES, { 1: 150 }, NOW)
    expect(p).toMatchObject({
      currentE1rm: 112.5,
      targetE1rm: 150,
      weeklyImprovementRate: 0.5,
      weeksToTarget: 75,
      reached: false,
    })
    expect(p.estimatedDate).toBe(addLocalDays(NOW_STR, 75 * 7))
  })

  it('calcula la tasa semanal real desde los deltas de las últimas semanas', () => {
    // estimate1RM redondea cada serie a 1 decimal antes de promediar: 90×5 → 101.3,
    // 70×5 → 78.8. El total sobre la ventana es 112.5+101.3+90+78.8 = 95.65 → 95.7.
    const sets = [
      makeSet({ id: 1, workoutId: 1, weightKg: 100, reps: 5, createdAt: ago(3) }),
      makeSet({ id: 2, workoutId: 2, weightKg: 90, reps: 5, createdAt: ago(10) }),
      makeSet({ id: 3, workoutId: 3, weightKg: 80, reps: 5, createdAt: ago(17) }),
      makeSet({ id: 4, workoutId: 4, weightKg: 70, reps: 5, createdAt: ago(24) }),
    ]
    const [p] = buildGoalProjections(sets, EXERCISES, { 1: 120 }, NOW)
    expect(p.currentE1rm).toBe(95.7)
    // Deltas semanales [11.2, 11.3, 11.2] → media 11.23 (2 decimales).
    expect(p.weeklyImprovementRate).toBe(11.23)
    expect(p.weeksToTarget).toBe(3)
    expect(p.estimatedDate).toBe(addLocalDays(NOW_STR, 3 * 7))
  })

  it('no proyecta fecha cuando la tendencia es plana o negativa', () => {
    const sets = [
      makeSet({ id: 1, workoutId: 1, weightKg: 70, reps: 5, createdAt: ago(3) }), // 78.75
      makeSet({ id: 2, workoutId: 2, weightKg: 80, reps: 5, createdAt: ago(10) }), // 90
      makeSet({ id: 3, workoutId: 3, weightKg: 90, reps: 5, createdAt: ago(17) }), // 101.25
      makeSet({ id: 4, workoutId: 4, weightKg: 100, reps: 5, createdAt: ago(24) }), // 112.5
    ]
    const [p] = buildGoalProjections(sets, EXERCISES, { 1: 100 }, NOW)
    expect(p.trend).toBe('down')
    expect(p.weeklyImprovementRate).toBe(0)
    expect(p.weeksToTarget).toBe(0)
    expect(p.estimatedDate).toBeNull()
  })

  it('ordena por semanas restantes, del más cercano al más lejano', () => {
    const sets = [
      makeSet({ id: 1, exerciseId: 1, weightKg: 100, reps: 5, createdAt: ago(1) }), // 112.5
      makeSet({ id: 2, exerciseId: 2, weightKg: 80, reps: 5, createdAt: ago(2) }), // 90
    ]
    const projections = buildGoalProjections(sets, EXERCISES, { 1: 125, 2: 140 }, NOW)
    expect(projections.map((p) => p.exerciseId)).toEqual([1, 2])
    expect(projections[0].weeksToTarget).toBe(25)
    expect(projections[1].weeksToTarget).toBe(100)
  })

  it('nombra con fallback «Ejercicio #N» si el ejercicio no está en el catálogo', () => {
    const sets = [makeSet({ id: 1, exerciseId: 999, weightKg: 100, reps: 5, createdAt: ago(1) })]
    const [p] = buildGoalProjections(sets, EXERCISES, { 999: 120 }, NOW)
    expect(p.exerciseName).toBe('Ejercicio #999')
    expect(p.weeksToTarget).toBe(15)
  })
})
// F132.4: helpers de la vista de objetivos. La página necesita una fila por
// objetivo del store (aunque no tenga proyección), un héroe y un estado
// «todos alcanzados» que no cuente objetivos sin datos.
describe('vista de objetivos (F132.4)', () => {
  const projection = (overrides: Partial<GoalProjection> = {}): GoalProjection => ({
    exerciseId: 1,
    exerciseName: 'Press de pecho con barra',
    currentE1rm: 112.5,
    targetE1rm: 150,
    weeklyImprovementRate: 0.5,
    weeksToTarget: 75,
    estimatedDate: '2028-02-14',
    reached: false,
    trend: 'up',
    ...overrides,
  })

  it('buildGoalRows incluye objetivos sin proyección y conserva el orden de Object.entries', () => {
    const rows = buildGoalRows({ 2: 140, 1: 150 }, [projection()], EXERCISES)
    // Las claves enteras se ordenan ascendente en Object.entries: 1 y después 2.
    expect(rows.map((r) => r.exerciseId)).toEqual([1, 2])
    expect(rows[0].projection?.targetE1rm).toBe(150)
    expect(rows[1].projection).toBeNull()
    expect(rows[1].exerciseName).toBe('Peso muerto')
  })

  it('buildGoalRows usa el nombre del catálogo o el fallback', () => {
    const rows = buildGoalRows({ 999: 120 }, [], EXERCISES)
    expect(rows[0].exerciseName).toBe('Ejercicio #999')
  })

  it('pickFeaturedGoal elige la menor ETA y desempata por avance', () => {
    const a = projection({ exerciseId: 1, weeksToTarget: 40, currentE1rm: 100, targetE1rm: 200 })
    const b = projection({ exerciseId: 2, weeksToTarget: 40, currentE1rm: 150, targetE1rm: 200 })
    const c = projection({ exerciseId: 3, weeksToTarget: 20 })
    expect(pickFeaturedGoal([a, b, c])?.exerciseId).toBe(3)
    expect(pickFeaturedGoal([a, b])?.exerciseId).toBe(2)
    expect(pickFeaturedGoal([projection({ reached: true })])).toBeNull()
    expect(pickFeaturedGoal([])).toBeNull()
  })

  it('isEveryGoalReached exige proyección para todos los objetivos', () => {
    const goals = { 1: 150, 2: 140 }
    expect(isEveryGoalReached(goals, [projection({ reached: true })])).toBe(false)
    expect(
      isEveryGoalReached(goals, [
        projection({ reached: true }),
        projection({ exerciseId: 2, reached: true }),
      ])
    ).toBe(true)
    expect(isEveryGoalReached({}, [])).toBe(false)
    expect(isEveryGoalReached(goals, [projection(), projection({ exerciseId: 2, reached: true })])).toBe(false)
  })

  it('goalProgressRatio clampa 0..1 y devuelve 0 con target 0', () => {
    expect(goalProgressRatio({ currentE1rm: 75, targetE1rm: 150 })).toBe(0.5)
    expect(goalProgressRatio({ currentE1rm: 200, targetE1rm: 150 })).toBe(1)
    expect(goalProgressRatio({ currentE1rm: 10, targetE1rm: 0 })).toBe(0)
    expect(goalProgressRatio({ currentE1rm: -5, targetE1rm: 150 })).toBe(0)
  })
})
