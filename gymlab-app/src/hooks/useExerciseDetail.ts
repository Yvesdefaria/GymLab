// Hook que reúne los datos de la ficha de un ejercicio: ficha, series registradas y workouts asociados.
import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { exerciseRepo, workoutRepo, workoutSetRepo } from '@/data/repositories'
import type { WorkoutSet } from '@/domain/types'

type LastSet = { weightKg: number; reps: number }

// Arrays/Map vacíos estables: evitan que los `??` creen referencias nuevas en cada render.
const EMPTY_SETS: WorkoutSet[] = []
const EMPTY_LAST_SETS = new Map<number, LastSet>()

// Consulta el ejercicio por slug, sus últimas cargas por ejercicio y el historial de series y workouts.
export const useExerciseDetail = (slug: string | undefined) => {
  const exercise = useLiveQuery(
    () => (slug ? exerciseRepo.getBySlug(slug) : undefined),
    [slug]
  )

  const lastSets = useLiveQuery(
    () =>
      exercise
        ? workoutSetRepo.getLastSets([exercise.id])
        : Promise.resolve(new Map<number, LastSet>()),
    [exercise]
  ) ?? EMPTY_LAST_SETS

  const exerciseSets = useLiveQuery(
    () => (exercise ? workoutSetRepo.getByExercise(exercise.id) : Promise.resolve([])),
    [exercise]
  ) ?? EMPTY_SETS

  const workoutIds = useMemo(
    () => Array.from(new Set(exerciseSets.map((s) => s.workoutId))),
    [exerciseSets]
  )
  const workouts = useLiveQuery(() => workoutRepo.getMany(workoutIds), [workoutIds]) ?? []

  return { exercise, lastSets, exerciseSets, workouts }
}
