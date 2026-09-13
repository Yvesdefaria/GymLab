// Fuente de verdad de la foto de sesión para ambas superficies: el resumen
// post-guardado (prCount exacto del guardado) y el detalle del historial
// (PRs derivados por ventana temporal). Consultas live de Dexie, sin duplicar
// los loaders ad-hoc de cada superficie.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { exerciseRepo, prRepo, routineRepo } from '@/data/repositories'
import { countPrsInWorkout } from '@/domain/prs'
import { prepareSessionImage, resolveWorkoutName } from '@/domain/sessionImage'
import type { SessionImageData } from '@/domain/sessionImage'
import { useLiveList } from './useLiveList'
import { useWorkout } from './useWorkouts'

export const useSessionPhotoData = (workoutId: number, prCount?: number): SessionImageData | null => {
  const { t } = useTranslation()
  const { workout, sets } = useWorkout(workoutId)

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

  // Todos los PRs: en historial, los de esta sesión se derivan por ventana
  // temporal; en el resumen post-guardado gana el prCount del guardado.
  const allPrs = useLiveList(() => prRepo.getAll())

  return useMemo(() => {
    if (!workout) return null
    const resolvedPrCount = prCount ?? countPrsInWorkout(workout, allPrs)
    const workoutName = resolveWorkoutName(routineTitle, t('share.freeWorkout'))
    return prepareSessionImage(workout, sets, nameById, resolvedPrCount, workoutName)
  }, [workout, sets, nameById, allPrs, prCount, routineTitle, t])
}