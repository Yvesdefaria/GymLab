// Test del orquestador de borrado de sesión (F98.6/D8): cascada atómica
// (workout + series + journal) y recálculo idempotente de los PRs afectados.
// Los repos y db se sustituyen por fakes en memoria (sin IndexedDB en node).
import { describe, expect, it, vi } from 'vitest'
import { estimate1RM } from '@/domain/prs'
import type { PRRecord, WorkoutSet } from '@/domain/types'

vi.mock('@/data/repositories/dexie/db', () => ({ db: { transaction: vi.fn() } }))
vi.mock('@/data/repositories', () => ({
  workoutRepo: { delete: vi.fn() },
  workoutSetRepo: { getByWorkout: vi.fn(), getByExercise: vi.fn(), deleteByWorkout: vi.fn() },
  sessionJournalRepo: { delete: vi.fn() },
  prRepo: { upsert: vi.fn(), deleteByExercise: vi.fn() },
}))

const { deleteWorkoutSession } = await import('@/data/workoutDeletion')
import type { WorkoutDeletionDeps } from '@/data/workoutDeletion'

const makeSet = (over: Partial<WorkoutSet> & { workoutId: number; exerciseId: number }): WorkoutSet => ({
  id: 1,
  setNumber: 1,
  weightKg: 100,
  reps: 5,
  completed: true,
  createdAt: '2026-09-01T10:00:00.000Z',
  ...over,
})

const makePr = (exerciseId: number, weightKg: number, reps: number): PRRecord => ({
  exerciseId,
  weightKg,
  reps,
  date: '2026-09-01T10:00:00.000Z',
  estimated1RM: estimate1RM(weightKg, reps),
})

// Estado en memoria + deps inyectables; observa que las mutaciones ocurran dentro
// de la transacción y que solo se abra una.
const makeHarness = () => {
  const state = {
    workouts: new Set<number>(),
    sets: [] as WorkoutSet[],
    journals: new Set<number>(),
    prs: new Map<number, PRRecord>(),
  }
  let inTransaction = false
  let transactionCalls = 0
  const mutationsOutsideTransaction: string[] = []
  const guard = (label: string) => {
    if (!inTransaction) mutationsOutsideTransaction.push(label)
  }

  const deps: WorkoutDeletionDeps = {
    transaction: async (scope) => {
      transactionCalls++
      inTransaction = true
      try {
        return await scope()
      } finally {
        inTransaction = false
      }
    },
    workoutSets: {
      getByWorkout: async (id) => state.sets.filter((s) => s.workoutId === id),
      getByExercise: async (id) => state.sets.filter((s) => s.exerciseId === id),
      deleteByWorkout: async (id) => {
        guard('deleteByWorkout')
        state.sets = state.sets.filter((s) => s.workoutId !== id)
      },
    },
    sessionJournals: {
      delete: async (id) => {
        guard('deleteJournal')
        state.journals.delete(id)
      },
    },
    workouts: {
      delete: async (id) => {
        guard('deleteWorkout')
        state.workouts.delete(id)
      },
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

describe('deleteWorkoutSession', () => {
  it('borra workout, series y journal y recalcula el PR afectado en una sola transacción', async () => {
    const h = makeHarness()
    h.state.workouts = new Set([9001, 9002])
    h.state.journals = new Set([9001])
    h.state.sets = [
      makeSet({ id: 1, workoutId: 9001, exerciseId: 7, weightKg: 120, reps: 3 }),
      makeSet({ id: 2, workoutId: 9002, exerciseId: 7, weightKg: 110, reps: 3 }),
    ]
    h.state.prs.set(7, makePr(7, 120, 3))

    await deleteWorkoutSession(9001, h.deps)

    expect(h.state.workouts.has(9001)).toBe(false)
    expect(h.state.workouts.has(9002)).toBe(true)
    expect(h.state.sets.some((s) => s.workoutId === 9001)).toBe(false)
    expect(h.state.journals.has(9001)).toBe(false)
    // El PR cae al mejor 1RM restante (110 × 3).
    expect(h.state.prs.get(7)?.weightKg).toBe(110)
    expect(h.state.prs.get(7)?.estimated1RM).toBe(estimate1RM(110, 3))
    // Cascada atómica: una transacción y ninguna mutación fuera de ella.
    expect(h.transactionCalls).toBe(1)
    expect(h.mutationsOutsideTransaction).toEqual([])
  })

  it('elimina el PR cuando su única fuente estaba en el workout borrado', async () => {
    const h = makeHarness()
    h.state.workouts = new Set([9001])
    h.state.sets = [makeSet({ id: 1, workoutId: 9001, exerciseId: 7, weightKg: 120, reps: 3 })]
    h.state.prs.set(7, makePr(7, 120, 3))

    await deleteWorkoutSession(9001, h.deps)

    expect(h.state.prs.has(7)).toBe(false)
  })

  it('no toca los PRs de ejercicios sin series en el workout borrado', async () => {
    const h = makeHarness()
    h.state.workouts = new Set([9001, 9002])
    h.state.sets = [
      makeSet({ id: 1, workoutId: 9001, exerciseId: 7, weightKg: 120, reps: 3 }),
      makeSet({ id: 2, workoutId: 9002, exerciseId: 9, weightKg: 80, reps: 5 }),
    ]
    const untouched = makePr(9, 80, 5)
    h.state.prs.set(7, makePr(7, 120, 3))
    h.state.prs.set(9, untouched)

    await deleteWorkoutSession(9001, h.deps)

    // El ejercicio 9 no tenía series en la sesión borrada: su PR queda intacto.
    expect(h.state.prs.get(9)).toEqual(untouched)
    // El ejercicio 7 sí estaba afectado y se quedó sin series: su PR se elimina.
    expect(h.state.prs.has(7)).toBe(false)
    expect(h.state.prs.size).toBe(1)
  })

  it('es idempotente: repetir el borrado deja exactamente los mismos PRs', async () => {
    const h = makeHarness()
    h.state.workouts = new Set([9001, 9002])
    h.state.sets = [
      makeSet({ id: 1, workoutId: 9001, exerciseId: 7, weightKg: 120, reps: 3 }),
      makeSet({ id: 2, workoutId: 9002, exerciseId: 7, weightKg: 105, reps: 4 }),
    ]
    h.state.prs.set(7, makePr(7, 120, 3))

    await deleteWorkoutSession(9001, h.deps)
    const afterFirst = new Map(h.state.prs)
    await deleteWorkoutSession(9001, h.deps)

    expect(h.state.prs).toEqual(afterFirst)
    expect(h.state.prs.get(7)?.estimated1RM).toBe(estimate1RM(105, 4))
  })
})
