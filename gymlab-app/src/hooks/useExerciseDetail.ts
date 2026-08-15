// Hook que reúne los datos de la ficha de un ejercicio: ficha, series registradas y workouts asociados.
import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useLiveList } from './useLiveList'
import { exerciseRepo, workoutRepo, workoutSetRepo } from '@/data/repositories'

type LastSet = { weightKg: number; reps: number }

// Map vacío estable: evita que `??` cree una referencia nueva en cada render.
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

  const exerciseSets = useLiveList(
    () => (exercise ? workoutSetRepo.getByExercise(exercise.id) : []),
    [exercise]
  )

  const workoutIds = useMemo(
    () => Array.from(new Set(exerciseSets.map((s) => s.workoutId))),
    [exerciseSets]
  )
  const workouts = useLiveList(() => workoutRepo.getMany(workoutIds), [workoutIds])

  return { exercise, lastSets, exerciseSets, workouts }
}
