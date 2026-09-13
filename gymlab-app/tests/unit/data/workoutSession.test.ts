// Mapeo de la nota de sesión al guardar (F98.1): el snapshot opcional `notes`
// debe llegar a la cabecera del workout sin quedar hardcodeado a ''.
// Se mockean los repositorios Dexie y el acceso a la tabla de series para aislar
// la orquestación de saveWorkoutSession (sin IndexedDB real en node).
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  create: vi.fn(async () => 42),
  upsert: vi.fn(async () => undefined),
}))

vi.mock('@/data/repositories', () => ({
  workoutRepo: { create: mocks.create },
  prRepo: { upsert: mocks.upsert },
}))

vi.mock('@/data/repositories/dexie/db', () => ({
  db: { workoutSets: { bulkAdd: vi.fn(async () => undefined) } },
}))

vi.mock('@/data/repositories/dexie/base', () => ({
  nextId: vi.fn(async () => 1),
}))

import type { WorkoutSessionSnapshot } from '@/data/workoutSession'
import type { ActiveExercise } from '@/store/activeWorkoutStore'

const { saveWorkoutSession } = await import('@/data/workoutSession')

const exercises = (): ActiveExercise[] => [
  {
    exerciseId: 1,
    exerciseName: 'Press banca',
    sets: [
      {
        id: 'set-1',
        exerciseId: 1,
        exerciseName: 'Press banca',
        setNumber: 1,
        weightKg: 50,
        reps: 5,
        completed: true,
      },
    ],
  },
]

// Snapshot base sin nota; la nota solo se añade cuando el test la declara.
const snapshot = (notes?: string): WorkoutSessionSnapshot => ({
  exercises: exercises(),
  startedAt: '2026-09-14T10:00:00.000Z',
  routineId: null,
  routineDayId: null,
  ...(notes === undefined ? {} : { notes }),
})

describe('saveWorkoutSession — nota de sesión (F98.1)', () => {
  beforeEach(() => {
    mocks.create.mockClear()
    mocks.upsert.mockClear()
    mocks.create.mockResolvedValue(42)
  })

  it('persiste la nota no vacía en la cabecera del workout', async () => {
    await saveWorkoutSession(snapshot('Trabajé hasta fallo en press'), new Map())
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ notes: 'Trabajé hasta fallo en press' })
    )
  })

  it('sin nota guarda cadena vacía, sin placeholder', async () => {
    await saveWorkoutSession(snapshot(), new Map())
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ notes: '' }))
  })
})
