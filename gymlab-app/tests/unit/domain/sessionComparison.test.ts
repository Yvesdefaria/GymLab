// Tests de la comparativa de sesiones: orden cronológico, deltas (posterior − anterior),
// filtro de series de trabajo, métricas derivadas y casos límite sin NaN/Infinity.
import { describe, expect, it } from 'vitest'
import type { Exercise, PRRecord, Workout, WorkoutSet } from '@/domain/types'
import { compareSessions } from '@/domain/sessionComparison'

const workout = (id: number, localDate: string, opts: Partial<Workout> = {}): Workout => ({
  id,
  startedAt: `${localDate}T18:00:00.000Z`,
  finishedAt: `${localDate}T19:00:00.000Z`,
  routineId: null,
  routineDayId: null,
  localDate,
  notes: '',
  totalVolume: 0,
  ...opts,
})

const set = (
  id: number,
  workoutId: number,
  exerciseId: number,
  weightKg: number,
  reps: number,
  opts: Partial<WorkoutSet> = {}
): WorkoutSet => ({
  id,
  workoutId,
  exerciseId,
  setNumber: id,
  weightKg,
  reps,
  completed: true,
  createdAt: `${workout(workoutId, '2026-09-01').localDate}T18:00:00.000Z`,
  ...opts,
})

const exercises: Exercise[] = [
  { id: 10, slug: 'press-banca', name: 'Press de banca', muscleGroup: 'pecho', equipment: ['barra'], instructions: '' },
  { id: 20, slug: 'sentadilla', name: 'Sentadilla', muscleGroup: 'pierna', equipment: ['barra'], instructions: '' },
  { id: 30, slug: 'peso-muerto', name: 'Peso muerto', muscleGroup: 'espalda', equipment: ['barra'], instructions: '' },
]
const exerciseById = new Map(exercises.map((e) => [e.id, e]))

const pr = (exerciseId: number, date: string): PRRecord => ({
  exerciseId,
  weightKg: 100,
  reps: 5,
  date,
  estimated1RM: 112.5,
})

describe('compareSessions', () => {
  it('ordena cronológicamente y calcula delta = posterior − anterior', () => {
    const older = workout(1, '2026-09-01')
    const newer = workout(2, '2026-09-08')

    const result = compareSessions({
      a: newer,
      aSets: [set(1, 2, 10, 100, 5)],
      b: older,
      bSets: [set(2, 1, 10, 80, 5)],
      prs: [],
      exerciseById,
    })

    expect(result.older.workout.id).toBe(1)
    expect(result.newer.workout.id).toBe(2)
    // Regresión del bug: mejorar volumen debe dar delta POSITIVO, no negativo.
    expect(result.deltas.volume.delta).toBe(100)
    expect(result.deltas.volume.pct).toBeCloseTo(25)
  })

  it('da el mismo resultado si se invierte el orden de los argumentos', () => {
    const older = workout(1, '2026-09-01')
    const newer = workout(2, '2026-09-08')
    const forward = compareSessions({
      a: newer,
      aSets: [set(1, 2, 10, 100, 5)],
      b: older,
      bSets: [set(2, 1, 10, 80, 5)],
      prs: [],
      exerciseById,
    })
    const reversed = compareSessions({
      a: older,
      aSets: [set(2, 1, 10, 80, 5)],
      b: newer,
      bSets: [set(1, 2, 10, 100, 5)],
      prs: [],
      exerciseById,
    })

    expect(reversed.older.workout.id).toBe(forward.older.workout.id)
    expect(reversed.newer.workout.id).toBe(forward.newer.workout.id)
    expect(reversed.deltas).toEqual(forward.deltas)
  })

  it('desempata por startedAt cuando comparten localDate', () => {
    const morning = workout(1, '2026-09-01', { startedAt: '2026-09-01T08:00:00.000Z' })
    const evening = workout(2, '2026-09-01', { startedAt: '2026-09-01T20:00:00.000Z' })

    const result = compareSessions({
      a: evening,
      aSets: [],
      b: morning,
      bSets: [],
      prs: [],
      exerciseById,
    })

    expect(result.older.workout.id).toBe(1)
    expect(result.newer.workout.id).toBe(2)
  })

  it('excluye calentamientos y series no completadas con el mismo criterio en ambas sesiones', () => {
    const result = compareSessions({
      a: workout(1, '2026-09-01'),
      aSets: [
        set(1, 1, 10, 100, 5),
        set(2, 1, 10, 200, 10, { isWarmup: true }),
        set(3, 1, 10, 150, 5, { completed: false }),
      ],
      b: workout(2, '2026-09-08'),
      bSets: [],
      prs: [],
      exerciseById,
    })

    expect(result.older.metrics.volume).toBe(500)
    expect(result.older.metrics.sets).toBe(1)
    expect(result.older.metrics.reps).toBe(5)
    expect(result.older.metrics.exercises).toBe(1)
  })

  it('calcula intensidad y peso medio con guardas de división por cero', () => {
    const result = compareSessions({
      a: workout(1, '2026-09-01'),
      aSets: [
        set(1, 1, 10, 100, 5),
        set(2, 1, 10, 100, 5),
      ],
      b: workout(2, '2026-09-08'),
      bSets: [
        set(3, 2, 10, 100, 0), // sin reps: no debe producir NaN/Infinity
      ],
      prs: [],
      exerciseById,
    })

    expect(result.older.metrics.volume).toBe(1000)
    expect(result.older.metrics.intensity).toBe(100) // 1000 kg / 10 reps
    expect(result.older.metrics.avgWeightPerSet).toBe(500) // 1000 kg / 2 series
    expect(result.newer.metrics.volume).toBe(0)
    expect(result.newer.metrics.reps).toBe(0)
    expect(result.newer.metrics.intensity).toBe(0)
    expect(result.newer.metrics.avgWeightPerSet).toBe(0)
    expect(Number.isFinite(result.newer.metrics.intensity)).toBe(true)
  })

  it('devuelve métricas en cero y pct null para una sesión sin series de trabajo', () => {
    const result = compareSessions({
      a: workout(1, '2026-09-01'),
      aSets: [],
      b: workout(2, '2026-09-08'),
      bSets: [set(1, 2, 10, 100, 5)],
      prs: [],
      exerciseById,
    })

    expect(result.older.metrics).toMatchObject({
      volume: 0,
      sets: 0,
      reps: 0,
      exercises: 0,
      intensity: 0,
      avgWeightPerSet: 0,
      avgE1rm: 0,
      muscleGroups: [],
    })
    // Sin base anterior no hay porcentaje posible.
    expect(result.deltas.volume).toEqual({ delta: 500, pct: null })
    expect(Number.isFinite(result.deltas.intensity.delta)).toBe(true)
  })

  it('cuenta ejercicios nuevos y compartidos sobre las series de trabajo', () => {
    const result = compareSessions({
      a: workout(1, '2026-09-01'),
      aSets: [set(1, 1, 10, 100, 5), set(2, 1, 20, 50, 5)],
      b: workout(2, '2026-09-08'),
      bSets: [set(3, 2, 10, 100, 5), set(4, 2, 30, 50, 5)],
      prs: [],
      exerciseById,
    })

    expect(result.older.metrics.exercises).toBe(2)
    expect(result.newer.metrics.exercises).toBe(2)
    expect(result.newExercises).toBe(1) // solo el 30 aparece únicamente en la posterior
    expect(result.sharedExercises).toBe(1) // el 10 está en ambas
  })

  it('calcula el e1RM medio solo sobre series con peso y reps válidos', () => {
    const result = compareSessions({
      a: workout(1, '2026-09-01'),
      aSets: [
        set(1, 1, 10, 100, 5), // e1RM 112.5
        set(2, 1, 10, 50, 10), // e1RM 66.7
        set(3, 1, 20, 0, 5), // peso 0: se ignora
      ],
      b: workout(2, '2026-09-08'),
      bSets: [],
      prs: [],
      exerciseById,
    })

    expect(result.older.metrics.avgE1rm).toBeCloseTo(89.6)
    expect(result.newer.metrics.avgE1rm).toBe(0)
  })

  it('agrupa el volumen muscular en orden descendente', () => {
    const result = compareSessions({
      a: workout(1, '2026-09-01'),
      aSets: [
        set(1, 1, 10, 100, 5), // pecho: 500
        set(2, 1, 20, 50, 10), // pierna: 500... se ajusta abajo
      ],
      b: workout(2, '2026-09-08'),
      bSets: [
        set(3, 2, 30, 100, 10), // espalda: 1000
        set(4, 2, 10, 100, 5), // pecho: 500
      ],
      prs: [],
      exerciseById,
    })

    expect(result.newer.metrics.muscleGroups).toEqual([
      { group: 'espalda', volume: 1000 },
      { group: 'pecho', volume: 500 },
    ])
  })

  it('cuenta los PRs dentro de la ventana temporal de cada sesión', () => {
    const result = compareSessions({
      a: workout(1, '2026-09-01'),
      aSets: [set(1, 1, 10, 100, 5)],
      b: workout(2, '2026-09-08'),
      bSets: [set(2, 2, 10, 110, 5)],
      prs: [
        pr(10, '2026-09-01T18:30:00.000Z'), // dentro de la anterior
        pr(20, '2026-09-08T18:30:00.000Z'), // dentro de la posterior
        pr(30, '2026-09-08T23:00:00.000Z'), // fuera de ambas ventanas
      ],
      exerciseById,
    })

    expect(result.older.metrics.prs).toBe(1)
    expect(result.newer.metrics.prs).toBe(1)
    expect(result.deltas.prs).toEqual({ delta: 0, pct: 0 })
  })

  it('usa workoutDurationMin y no emite NaN al comparar duraciones', () => {
    const result = compareSessions({
      a: workout(1, '2026-09-01'),
      aSets: [],
      b: workout(2, '2026-09-08', { startedAt: '2026-09-08T18:00:00.000Z', finishedAt: '2026-09-08T19:30:00.000Z' }),
      bSets: [],
      prs: [],
      exerciseById,
    })

    expect(result.older.metrics.durationMin).toBe(60)
    expect(result.newer.metrics.durationMin).toBe(90)
  })
})
