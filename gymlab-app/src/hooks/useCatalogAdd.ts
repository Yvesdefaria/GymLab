// Alta de un ejercicio desde el catálogo «Ejercicios» (F98.3 / #6).
// Regla de destino (D7): si hay sesión activa se añade a ella con undo; si no, se
// abre el selector de rutina para elegir el día. La creación del ítem de rutina y su
// undo viven en la capa de datos (routineRepo.addItem/removeItem).
import { useCallback, useState } from 'react'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useStartSession } from '@/hooks/useStartSession'
import { routineRepo } from '@/data/repositories'
import type { Exercise } from '@/domain/types'
import type { RoutineItemDraft } from '@/data/repositories/types'

// Defaults del alta desde catálogo: mismo punto de partida que el builder de rutinas.
export const CATALOG_ADD_DEFAULTS = { targetSets: 3, targetReps: 10, restSec: 90 } as const

export type CatalogAddDestination = 'session' | 'routine'

// Destino del alta: sesión activa (startedAt no nulo) o selector de rutina.
export const catalogAddDestination = (startedAt: string | null): CatalogAddDestination =>
  startedAt !== null ? 'session' : 'routine'

// Borrador del ítem de rutina con los defaults del alta desde catálogo.
export const buildRoutineItemDraft = (exerciseId: number): RoutineItemDraft => ({
  exerciseId,
  ...CATALOG_ADD_DEFAULTS,
})

export const useCatalogAdd = () => {
  const startedAt = useActiveWorkoutStore((s) => s.startedAt)
  const pushUndo = useActiveWorkoutStore((s) => s.pushUndo)
  const { startFreeExercise } = useStartSession()
  // Ejercicio pendiente de destino cuando no hay sesión activa.
  const [pending, setPending] = useState<Exercise | null>(null)

  const add = useCallback(
    async (exercise: Exercise) => {
      if (catalogAddDestination(startedAt) === 'session') {
        // El snapshot previo permite deshacer el alta restaurando la sesión.
        pushUndo(exercise.name, { messageKey: 'layout.undo.added' })
        await startFreeExercise(exercise.id, exercise.name)
        return
      }
      setPending(exercise)
    },
    [startedAt, pushUndo, startFreeExercise]
  )

  // Día elegido: persiste el ítem y registra el undo como borrado del ítem creado
  // (fuera de la sesión no aplica el snapshot del store, D9).
  const chooseDay = useCallback(
    async (dayId: number) => {
      const exercise = pending
      setPending(null)
      if (!exercise) return
      const itemId = await routineRepo.addItem(dayId, buildRoutineItemDraft(exercise.id))
      pushUndo(exercise.name, {
        messageKey: 'layout.undo.added',
        run: () => {
          void routineRepo.removeItem(itemId)
        },
      })
    },
    [pending, pushUndo]
  )

  return { add, pending, chooseDay, closeSheet: () => setPending(null) }
}
