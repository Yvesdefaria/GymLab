// Nota de sesión unificada (F84): vive SOLO en Workout.notes. La leen el sheet
// post-entreno y el panel del detalle; el guardado pasa por workoutRepo.update.
import { useCallback, useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { workoutRepo } from '@/data/repositories'

// Ventana máxima de carga antes de declararla colgada (F84/R3-2): sin tope, un
// IndexedDB que nunca responde deja el Guardar y el lápiz muertos sin mensaje.
export const NOTE_LOAD_TIMEOUT_MS = 4000

// Sentinel de rechazo del querier: dexie-react-hooks re-lanza los errores
// durante el render (los atraparía el error boundary). Capturarlos acá los
// convierte en estado y el hook siempre devuelve algo usable.
const NOTE_LOAD_FAILED = Symbol('note-load-failed')

// Save del hook exportado para test (patrón del repo: lógica pura del hook).
export const saveWorkoutNote = async (
  update: (id: number, patch: { notes: string }) => Promise<unknown>,
  workoutId: number | null,
  value: string,
): Promise<void> => {
  if (workoutId === null) return
  await update(workoutId, { notes: value.trim() })
}

export const useWorkoutNote = (workoutId: number | null) => {
  // Default undefined = «cargando», distinto de «vacía»: la precarga no debe
  // pisar lo que el usuario escribe antes de que la query resuelva.
  const load = useLiveQuery(
    async () => {
      if (!workoutId) return ''
      try {
        const workout = await workoutRepo.getById(workoutId)
        return workout?.notes ?? ''
      } catch {
        return NOTE_LOAD_FAILED
      }
    },
    [workoutId],
    undefined
  )

  const loadFailed = load === NOTE_LOAD_FAILED
  const note = typeof load === 'string' ? load : undefined
  const ready = note !== undefined

  const [prevWorkoutId, setPrevWorkoutId] = useState(workoutId)
  const [timedOut, setTimedOut] = useState(false)
  // Reset del latch por carga (R3-REL-001): al cambiar `workoutId` la ventana de
  // 4 s se rearma para la carga nueva. Ajuste durante el render (no en un effect):
  // evita un frame commiteado con `failed` stale tras el cambio.
  if (prevWorkoutId !== workoutId) {
    setPrevWorkoutId(workoutId)
    setTimedOut(false)
  }

  // `!ready` en la derivación: si la query resuelve DESPUÉS del timeout, el
  // fallo se limpia solo (recuperación) sin tocar más estado.
  const failed = loadFailed || (timedOut && !ready)

  useEffect(() => {
    if (workoutId == null || ready || failed) return
    const timer = setTimeout(() => setTimedOut(true), NOTE_LOAD_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [workoutId, ready, failed])

  const save = useCallback(
    async (value: string) =>
      saveWorkoutNote((id, patch) => workoutRepo.update(id, patch), workoutId, value),
    [workoutId]
  )

  return { note, ready, failed, save }
}
