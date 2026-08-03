import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ActiveSet {
  id: string
  exerciseId: number
  exerciseName: string
  setNumber: number
  weightKg: number
  reps: number
  completed: boolean
}

export interface ActiveExercise {
  exerciseId: number
  exerciseName: string
  sets: ActiveSet[]
}

interface ActiveWorkoutState {
  workoutId: number | null
  startedAt: string | null
  routineId: number | null
  exercises: ActiveExercise[]
  restSeconds: number
  restRemaining: number
  isResting: boolean

  startWorkout: (routineId?: number) => void
  addExercise: (exerciseId: number, exerciseName: string) => void
  removeExercise: (exerciseId: number) => void
  addSet: (exerciseId: number) => void
  removeSet: (exerciseId: number, setId: string) => void
  updateSet: (exerciseId: number, setId: string, changes: Partial<Pick<ActiveSet, 'weightKg' | 'reps' | 'completed'>>) => void
  setRestSeconds: (seconds: number) => void
  startRest: () => void
  tickRest: () => void
  stopRest: () => void
  finishWorkout: () => ActiveWorkoutResult | null
  reset: () => void
}

let setCounter = 0
const genSetId = () => `set-${Date.now()}-${++setCounter}`

const calcTotalVolume = (exercises: ActiveExercise[]): number => {
  let total = 0
  for (const ex of exercises) {
    for (const set of ex.sets) {
      if (set.completed) total += set.weightKg * set.reps
    }
  }
  return total
}

export interface ActiveWorkoutResult {
  totalVolume: number
  exerciseCount: number
  completedSets: number
  totalSets: number
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>()(
  persist(
    (set, get) => ({
      workoutId: null,
      startedAt: null,
      routineId: null,
      exercises: [],
      restSeconds: 90,
      restRemaining: 0,
      isResting: false,

      startWorkout: (routineId) => {
        set({
          workoutId: null,
          startedAt: new Date().toISOString(),
          routineId: routineId ?? null,
          exercises: [],
          restSeconds: 90,
          restRemaining: 0,
          isResting: false,
        })
      },

      addExercise: (exerciseId, exerciseName) => {
        const { exercises } = get()
        if (exercises.some((e) => e.exerciseId === exerciseId)) return
        set({
          exercises: [
            ...exercises,
            {
              exerciseId,
              exerciseName,
              sets: [
                {
                  id: genSetId(),
                  exerciseId,
                  exerciseName,
                  setNumber: 1,
                  weightKg: 0,
                  reps: 0,
                  completed: false,
                },
              ],
            },
          ],
        })
      },

      removeExercise: (exerciseId) => {
        set({ exercises: get().exercises.filter((e) => e.exerciseId !== exerciseId) })
      },

      addSet: (exerciseId) => {
        const { exercises } = get()
        set({
          exercises: exercises.map((ex) => {
            if (ex.exerciseId !== exerciseId) return ex
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
        if (!isResting || restRemaining <= 0) {
          set({ isResting: false, restRemaining: 0 })
          return
        }
        set({ restRemaining: restRemaining - 1 })
      },

      stopRest: () => set({ isResting: false, restRemaining: 0 }),

      finishWorkout: () => {
        const { exercises } = get()
        const totalVolume = calcTotalVolume(exercises)
        const completedSets = exercises.reduce(
          (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
          0
        )
        const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0)

        const result: ActiveWorkoutResult = {
          totalVolume,
          exerciseCount: exercises.length,
          completedSets,
          totalSets,
        }

        get().reset()
        return result
      },

      reset: () => {
        set({
          workoutId: null,
          startedAt: null,
          routineId: null,
          exercises: [],
          restRemaining: 0,
          isResting: false,
        })
      },
    }),
    {
      name: 'gymLab-activeWorkout',
      partialize: (state) => ({
        workoutId: state.workoutId,
        startedAt: state.startedAt,
        routineId: state.routineId,
        exercises: state.exercises,
        restSeconds: state.restSeconds,
      }),
    }
  )
)
