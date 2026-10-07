// Fuente de verdad de la foto de sesión para ambas superficies: el resumen
// post-guardado (prCount exacto del guardado) y el detalle del historial
// (PRs derivados por ventana temporal). `workout`/`sets` llegan del consumidor:
// una sola suscripción por página (F120/S1). Consultas live de Dexie, sin duplicar
// los loaders ad-hoc de cada superficie.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { exerciseRepo, prRepo, routineRepo } from '@/data/repositories'
import { countPrsInWorkout } from '@/domain/prs'
import { prepareSessionImage, resolveWorkoutName } from '@/domain/sessionImage'
import type { SessionImageData } from '@/domain/sessionImage'
import type { Workout, WorkoutSet } from '@/domain/types'
import { useLiveList } from './useLiveList'

export const useSessionPhotoData = (
  workout: Workout | undefined,
  sets: WorkoutSet[],
  prCount?: number
): SessionImageData | null => {
  const { t } = useTranslation()

  // Nombres de catálogo de los ejercicios con series en la sesión.
  const exerciseIds = useMemo(() => [...new Set(sets.map((s) => s.exerciseId))], [sets])
  const exercises = useLiveList(() => exerciseRepo.getByIds(exerciseIds), [exerciseIds])
  const nameById = useMemo(() => new Map(exercises.map((e) => [e.id, e.name])), [exercises])

  // Título de la rutina si la sesión vino de una; el fallback localizado lo
  // resuelve el dominio (resolveWorkoutName) con la clave share.freeWorkout.
  const routineTitle = useLiveQuery(
    async () => {
      if (workout?.routineId == null) return undefined
      const routine = await routineRepo.getById(workout.routineId)
      return routine?.title
    },
    [workout?.routineId]
  )

  // PRs de esta sesión: el resumen post-guardado ya trae el prCount exacto (no toca
  // la tabla); el detalle histórico consulta solo la ventana [startedAt, finishedAt]
  // por el índice `date` en vez de materializar todos los PRs (F120/S2).
  const prsInWindow = useLiveList(
    () =>
      prCount === undefined && workout?.finishedAt
        ? prRepo.getInWindow(workout.startedAt, workout.finishedAt)
        : [],
    [prCount, workout?.startedAt, workout?.finishedAt]
  )

  return useMemo(() => {
    if (!workout) return null
    const resolvedPrCount = prCount ?? countPrsInWorkout(workout, prsInWindow)
    const workoutName = resolveWorkoutName(routineTitle, t('share.freeWorkout'))
    return prepareSessionImage(workout, sets, nameById, resolvedPrCount, workoutName)
  }, [workout, sets, nameById, prsInWindow, prCount, routineTitle, t])
}
