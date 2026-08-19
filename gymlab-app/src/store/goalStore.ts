// Store de objetivos de e1rm por ejercicio (estado efímero, persiste en localStorage).
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GoalState {
  goals: Record<number, number> // exerciseId → targetE1rm
  setGoal: (exerciseId: number, targetE1rm: number) => void
  removeGoal: (exerciseId: number) => void
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set) => ({
      goals: {},
      setGoal: (exerciseId, targetE1rm) =>
        set((state) => ({
          goals: { ...state.goals, [exerciseId]: targetE1rm },
        })),
      removeGoal: (exerciseId) =>
        set((state) => {
          const { [exerciseId]: _, ...rest } = state.goals
          return { goals: rest }
        }),
    }),
    { name: 'gymlab-goals' }
  )
)
