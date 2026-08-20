// Store de la sesión de entrenamiento activa (estado efímero) con Zustand.
// Contiene ejercicios, series, descansos y un historial de deshacer.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { playBoxingBellSound } from '@/lib/feedback'

// Serie individual de un ejercicio dentro de la sesión activa.
export interface ActiveSet {
  id: string
  exerciseId: number
  exerciseName: string
  setNumber: number
  weightKg: number
  reps: number
  completed: boolean
  isWarmup?: boolean
  rpe?: number
  rir?: number
  supersetGroup?: string
  // Cardio fields (when category === 'cardio')
  durationSeconds?: number
  distanceMeters?: number
}

// Ejercicio cargado en la sesión con su lista de series.
export interface ActiveExercise {
  exerciseId: number
  exerciseName: string
  supersetGroup?: string
  sets: ActiveSet[]
}

// Item para cargar un día de rutina en la sesión activa.
export interface RoutineDayLoadItem {
  exerciseId: number
  exerciseName: string
  restSec?: number
  supersetGroup?: string
  sets: ActiveSet[]
}

// Snapshot del estado para poder deshacer el último cambio.
interface UndoEntry {
  label: string
  snapshot: ActiveExercise[]
  ts: number
}

// Forma del estado y acciones públicas del store de sesión activa.
interface ActiveWorkoutState {
  workoutId: number | null
  startedAt: string | null
  routineId: number | null
  routineDayId: number | null
  exercises: ActiveExercise[]
  restSeconds: number
  restRemaining: number
  isResting: boolean
  undoStack: UndoEntry[]

  startWorkout: (routineId?: number, routineDayId?: number) => void
  loadRoutineDay: (items: RoutineDayLoadItem[], routineId: number, routineDayId: number) => void
  addExercise: (exerciseId: number, exerciseName: string, sets?: ActiveSet[]) => void
  removeExercise: (exerciseId: number) => void
  completeExercise: (exerciseId: number) => void
  addSet: (exerciseId: number) => void
  removeSet: (exerciseId: number, setId: string) => void
  updateSet: (
    exerciseId: number,
    setId: string,
    changes: Partial<Pick<ActiveSet, 'weightKg' | 'reps' | 'completed' | 'rpe' | 'rir' | 'isWarmup' | 'supersetGroup'>>
  ) => void
  setRestSeconds: (seconds: number) => void
  startRest: () => void
  tickRest: () => void
  stopRest: () => void
  pushUndo: (label: string) => void
  undo: () => boolean
  clearUndo: () => void
  reset: () => void
}

// Contador + timestamp para ids de serie únicos.
let setCounter = 0
const genSetId = () => `set-${Date.now()}-${++setCounter}`

// Convierte borradores {peso, reps} en series completas sin marcar.
const toSets = (
  exerciseId: number,
  exerciseName: string,
  drafts: { weightKg: number; reps: number; isWarmup?: boolean }[],
  startNumber = 1
): ActiveSet[] =>
  drafts.map((d, i) => ({
    id: genSetId(),
    exerciseId,
    exerciseName,
    setNumber: startNumber + i,
    weightKg: d.weightKg,
    reps: d.reps,
    completed: false,
    isWarmup: d.isWarmup,
  }))

// Store global de la sesión activa persistido en el navegador.
// Consumir con selectores individuales para evitar re-renders del árbol.
export const useActiveWorkoutStore = create<ActiveWorkoutState>()(
  persist(
    (set, get) => ({
      workoutId: null,
      startedAt: null,
      routineId: null,
      routineDayId: null,
      exercises: [],
      restSeconds: 90,
      restRemaining: 0,
      isResting: false,
      undoStack: [],

      startWorkout: (routineId, routineDayId) => {
        set({
          workoutId: null,
          startedAt: new Date().toISOString(),
          routineId: routineId ?? null,
          routineDayId: routineDayId ?? null,
          exercises: [],
          restSeconds: 90,
          restRemaining: 0,
          isResting: false,
          undoStack: [],
        })
        // Gong de campana: marca el inicio de la sesión.
        playBoxingBellSound()
      },

      loadRoutineDay: (items, routineId, routineDayId) => {
        const exercises: ActiveExercise[] = items.map((it) => ({
          exerciseId: it.exerciseId,
          exerciseName: it.exerciseName,
          supersetGroup: it.supersetGroup,
          // Si el día no define series, se crea una en blanco para poder editar.
          sets: it.sets.length > 0 ? it.sets : toSets(it.exerciseId, it.exerciseName, [{ weightKg: 0, reps: 0 }]),
        }))
        // Descanso por defecto: el del primer ejercicio o 90 s si no viene definido.
        const rest = items[0]?.restSec ?? 90
        set({
          workoutId: null,
          startedAt: new Date().toISOString(),
          routineId,
          routineDayId,
          exercises,
          restSeconds: rest,
          restRemaining: 0,
          isResting: false,
          undoStack: [],
        })
        // Gong de campana: marca el inicio de la sesión.
        playBoxingBellSound()
      },

      addExercise: (exerciseId, exerciseName, providedSets) => {
        const { exercises, startedAt } = get()
        if (exercises.some((e) => e.exerciseId === exerciseId)) return
        const sets =
          providedSets && providedSets.length > 0
            ? providedSets
            : toSets(exerciseId, exerciseName, [{ weightKg: 0, reps: 0 }])
        set({
          exercises: [
            ...exercises,
            { exerciseId, exerciseName, sets },
          ],
        })
        // Primer ejercicio de la sesión: arranca el cronómetro y suena la campana.
        if (startedAt === null) {
          set({ startedAt: new Date().toISOString() })
          playBoxingBellSound()
        }
      },

      removeExercise: (exerciseId) => {
        set({ exercises: get().exercises.filter((e) => e.exerciseId !== exerciseId) })
      },

      completeExercise: (exerciseId) => {
        set({
          exercises: get().exercises.map((ex) => {
            if (ex.exerciseId !== exerciseId) return ex
            return {
              ...ex,
              sets: ex.sets.map((s) => ({ ...s, completed: true })),
            }
          }),
        })
      },

      addSet: (exerciseId) => {
        const { exercises } = get()
        set({
          exercises: exercises.map((ex) => {
            if (ex.exerciseId !== exerciseId) return ex
            // La nueva serie hereda peso y repeticiones de la última registrada.
            const lastSet = ex.sets[ex.sets.length - 1]
            return {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  id: genSetId(),
                  exerciseId,
                  exerciseName: ex.exerciseName,
                  setNumber: ex.sets.length + 1,
                  weightKg: lastSet?.weightKg ?? 0,
                  reps: lastSet?.reps ?? 0,
                  completed: false,
                },
              ],
            }
          }),
        })
      },

      removeSet: (exerciseId, setId) => {
        const { exercises } = get()
        set({
          exercises: exercises
            .map((ex) => {
              if (ex.exerciseId !== exerciseId) return ex
              return { ...ex, sets: ex.sets.filter((s) => s.id !== setId) }
            })
            // Si el ejercicio se queda sin series, se elimina de la sesión.
            .filter((ex) => ex.sets.length > 0),
        })
      },

      updateSet: (exerciseId, setId, changes) => {
        const { exercises } = get()
        set({
          exercises: exercises.map((ex) => {
            if (ex.exerciseId !== exerciseId) return ex
            return {
              ...ex,
              sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...changes } : s)),
            }
          }),
        })
      },

      setRestSeconds: (seconds) => set({ restSeconds: seconds }),

      startRest: () => {
        const { restSeconds } = get()
        set({ isResting: true, restRemaining: restSeconds })
      },

      tickRest: () => {
        const { restRemaining, isResting } = get()
        // Descanso terminado: corta y resetea para no quedarse en negativo.
        if (!isResting || restRemaining <= 0) {
          set({ isResting: false, restRemaining: 0 })
          return
        }
        set({ restRemaining: restRemaining - 1 })
      },

      stopRest: () => set({ isResting: false, restRemaining: 0 }),

      pushUndo: (label) => {
        const { exercises, undoStack } = get()
        set({
          undoStack: [
            ...undoStack.slice(-4),
            // Copia profunda vía JSON para restaurar el estado sin referencias compartidas.
            { label, snapshot: JSON.parse(JSON.stringify(exercises)) as ActiveExercise[], ts: Date.now() },
          ],
        })
      },

      undo: () => {
        const { undoStack } = get()
        if (undoStack.length === 0) return false
        // Toma el snapshot más reciente (último en pila) y restaura el estado.
        const [next, ...rest] = [...undoStack].reverse()
        set({ exercises: next.snapshot, undoStack: [...rest].reverse() })
        return true
      },

      clearUndo: () => set({ undoStack: [] }),

      reset: () => {
        set({
          workoutId: null,
          startedAt: null,
          routineId: null,
          routineDayId: null,
          exercises: [],
          restRemaining: 0,
          isResting: false,
          undoStack: [],
        })
      },
    }),
    {
      name: 'gymLab-activeWorkout',
      // Solo se persisten estos campos; temporizador de descanso y undo quedan en memoria.
      partialize: (state) => ({
        workoutId: state.workoutId,
        startedAt: state.startedAt,
        routineId: state.routineId,
        routineDayId: state.routineDayId,
        exercises: state.exercises,
        restSeconds: state.restSeconds,
      }),
    }
  )
)
