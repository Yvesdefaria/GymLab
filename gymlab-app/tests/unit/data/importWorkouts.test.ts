// Test del orquestador de importación CSV (F81): un workout por fecha con sus
// series enlazadas al id REAL devuelto por create, dedup por firma de sesión,
// recálculo de PRs y una sola transacción. Fakes en memoria (sin IndexedDB).
import { describe, expect, it, vi } from 'vitest'
import { estimate1RM } from '@/domain/prs'
import type { PRRecord, Workout, WorkoutSet } from '@/domain/types'
import type { ParsedImport } from '@/domain/importParsers'

vi.mock('@/data/repositories/dexie/db', () => ({ db: { transaction: vi.fn() } }))
vi.mock('@/data/repositories', () => ({
  workoutRepo: { getByDate: vi.fn(), create: vi.fn() },
  workoutSetRepo: { getByWorkoutIds: vi.fn(), create: vi.fn(), getByExercise: vi.fn() },
  prRepo: { upsert: vi.fn(), deleteByExercise: vi.fn() },
}))

const { importParsedWorkouts } = await import('@/data/importWorkouts')
import type { ImportWorkoutsDeps } from '@/data/importWorkouts'

const makeSet = (over: Partial<WorkoutSet> & { workoutId: number; exerciseId: number }): WorkoutSet => ({
  id: 1,
  setNumber: 1,
  weightKg: 100,
  reps: 5,
  completed: true,
  createdAt: '2026-09-01T10:00:00.000Z',
  ...over,
})

const makeWorkout = (over: Partial<Workout> & { id: number; localDate: string }): Workout => ({
  startedAt: `${over.localDate}T00:00:00`,
  finishedAt: `${over.localDate}T00:00:00`,
  routineId: null,
  routineDayId: null,
  notes: '',
  totalVolume: 0,
  ...over,
})

const makeParsed = (): ParsedImport => ({
  source: 'strong',
  workouts: [
    makeWorkout({ id: 1, localDate: '2024-01-02', totalVolume: 1000 }),
    makeWorkout({ id: 2, localDate: '2024-01-03', totalVolume: 400 }),
  ],
  sets: [
    makeSet({ id: 1, workoutId: 1, exerciseId: 7, setNumber: 1, weightKg: 60, reps: 10 }),
    makeSet({ id: 2, workoutId: 1, exerciseId: 7, setNumber: 2, weightKg: 65, reps: 8, completed: false }),
    makeSet({ id: 3, workoutId: 2, exerciseId: 9, setNumber: 1, weightKg: 80, reps: 5 }),
  ],
  errors: [],
  unmatched: [],
})

// Estado en memoria + deps inyectables; observa mutaciones fuera de la transacción.
const makeHarness = () => {
  const state = {
    workouts: [] as Workout[],
    sets: [] as WorkoutSet[],
    prs: new Map<number, PRRecord>(),
    nextWorkoutId: 100,
    nextSetId: 1000,
  }
  let inTransaction = false
  let transactionCalls = 0
  const mutationsOutsideTransaction: string[] = []
  const guard = (label: string) => {
    if (!inTransaction) mutationsOutsideTransaction.push(label)
  }

  const deps: ImportWorkoutsDeps = {
    transaction: async (scope) => {
      transactionCalls++
      inTransaction = true
      try {
        return await scope()
      } finally {
        inTransaction = false
      }
    },
    workouts: {
      getByDate: async (date) => state.workouts.filter((w) => w.localDate === date),
      create: async (workout) => {
        guard('createWorkout')
        const id = state.nextWorkoutId++
        state.workouts.push({ ...workout, id })
        return id
      },
    },
    workoutSets: {
      getByWorkoutIds: async (ids) => state.sets.filter((s) => ids.includes(s.workoutId)),
      create: async (set) => {
        guard('createSet')
        const id = state.nextSetId++
        state.sets.push({ ...set, id })
        return id
      },
      getByExercise: async (exerciseId) => state.sets.filter((s) => s.exerciseId === exerciseId),
    },
    prs: {
      upsert: async (pr) => {
        guard('upsertPR')
        state.prs.set(pr.exerciseId, pr)
      },
      deleteByExercise: async (id) => {
        guard('deletePR')
        state.prs.delete(id)
      },
    },
  }

  return {
    deps,
    state,
    mutationsOutsideTransaction,
    get transactionCalls() {
      return transactionCalls
    },
  }
}

describe('importParsedWorkouts', () => {
  it('enlaza cada serie al id REAL de la sesión creada (regresión del bug crítico)', async () => {
    const h = makeHarness()

    const result = await importParsedWorkouts(makeParsed(), h.deps)

    expect(result).toEqual({ imported: 2, duplicates: 0 })
    expect(h.state.workouts.map((w) => w.id)).toEqual([100, 101])
    // Las series guardan el id real (100/101), nunca el placeholder del parser (1/2).
    expect(h.state.sets.map((s) => [s.workoutId, s.exerciseId])).toEqual([
      [100, 7],
      [100, 7],
      [101, 9],
    ])
    expect(h.state.sets.every((s) => s.id >= 1000)).toBe(true)
    // Una sola transacción y ninguna mutación fuera de ella.
    expect(h.transactionCalls).toBe(1)
    expect(h.mutationsOutsideTransaction).toEqual([])
  })

  it('salta como duplicada una sesión con la misma fecha y misma firma (multiconjunto)', async () => {
    const h = makeHarness()
    // Sesión existente el 2024-01-02 con las mismas series en otro orden y sin
    // importar setNumber/completed: la firma es la misma.
    h.state.workouts.push(makeWorkout({ id: 50, localDate: '2024-01-02' }))
    h.state.sets.push(
      makeSet({ id: 900, workoutId: 50, exerciseId: 7, setNumber: 5, weightKg: 65, reps: 8 }),
      makeSet({ id: 901, workoutId: 50, exerciseId: 7, setNumber: 6, weightKg: 60, reps: 10, completed: false })
    )

    const result = await importParsedWorkouts(makeParsed(), h.deps)

    expect(result).toEqual({ imported: 1, duplicates: 1 })
    // No se crea nada para la fecha duplicada; solo entra la sesión del 2024-01-03.
    expect(h.state.workouts.filter((w) => w.localDate === '2024-01-02').map((w) => w.id)).toEqual([50])
    expect(h.state.sets.filter((s) => s.workoutId === 50)).toHaveLength(2)
    expect(h.state.workouts.find((w) => w.localDate === '2024-01-03')?.id).toBe(100)
  })

  it('importa una sesión de la misma fecha cuando la firma es distinta', async () => {
    const h = makeHarness()
    h.state.workouts.push(makeWorkout({ id: 50, localDate: '2024-01-02' }))
    h.state.sets.push(makeSet({ id: 900, workoutId: 50, exerciseId: 7, weightKg: 999, reps: 1 }))

    const result = await importParsedWorkouts(makeParsed(), h.deps)

    expect(result).toEqual({ imported: 2, duplicates: 0 })
    expect(h.state.workouts.filter((w) => w.localDate === '2024-01-02')).toHaveLength(2)
    expect(h.state.sets.filter((s) => s.workoutId === 100)).toHaveLength(2)
  })

  it('recalcula el PR con el mejor de las series restantes (incluye las previas al import)', async () => {
    const h = makeHarness()
    // Serie previa del ejercicio 7 con mejor 1RM que todo lo importado.
    h.state.workouts.push(makeWorkout({ id: 50, localDate: '2023-12-01' }))
    h.state.sets.push(makeSet({ id: 900, workoutId: 50, exerciseId: 7, weightKg: 100, reps: 5 }))

    await importParsedWorkouts(makeParsed(), h.deps)

    // El PR del 7 es el mejor de las restantes (100×5), no el importado (65×8).
    expect(h.state.prs.get(7)).toMatchObject({ exerciseId: 7, weightKg: 100, reps: 5 })
    expect(h.state.prs.get(7)?.estimated1RM).toBe(estimate1RM(100, 5))
    // El 9 no tenía serie previa: su PR sale de la serie importada (80×5).
    expect(h.state.prs.get(9)).toMatchObject({ exerciseId: 9, weightKg: 80, reps: 5 })
  })

  it('elimina el PR del ejercicio sin series válidas restantes', async () => {
    const h = makeHarness()
    h.state.prs.set(9, {
      exerciseId: 9,
      weightKg: 120,
      reps: 3,
      date: '2026-09-01T10:00:00.000Z',
      estimated1RM: estimate1RM(120, 3),
    })
    const parsed = makeParsed()
    // La única serie importada del 9 es incompleta: no cuenta como fuente de PR.
    parsed.sets = [makeSet({ id: 1, workoutId: 1, exerciseId: 9, weightKg: 80, reps: 5, completed: false })]
    parsed.workouts = [makeWorkout({ id: 1, localDate: '2024-01-02' })]

    const result = await importParsedWorkouts(parsed, h.deps)

    expect(result).toEqual({ imported: 1, duplicates: 0 })
    expect(h.state.prs.has(9)).toBe(false)
  })

  it('cuenta importadas y duplicadas por sesión', async () => {
    const h = makeHarness()
    h.state.workouts.push(makeWorkout({ id: 50, localDate: '2024-01-02' }))
    h.state.sets.push(
      makeSet({ id: 900, workoutId: 50, exerciseId: 7, weightKg: 60, reps: 10 }),
      makeSet({ id: 901, workoutId: 50, exerciseId: 7, weightKg: 65, reps: 8 })
    )

    const result = await importParsedWorkouts(makeParsed(), h.deps)

    expect(result).toEqual({ imported: 1, duplicates: 1 })
  })
})
