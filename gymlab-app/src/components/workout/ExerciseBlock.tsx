import { Plus, X } from 'lucide-react'
import { SetRow } from './SetRow'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import type { ActiveExercise } from '@/store/activeWorkoutStore'

type ExerciseBlockProps = {
  exercise: ActiveExercise
  prMap: Map<number, { weightKg: number; reps: number; estimated1RM: number }>
}

export const ExerciseBlock = ({ exercise, prMap }: ExerciseBlockProps) => {
  const { addSet, removeSet, updateSet, removeExercise } = useActiveWorkoutStore()
  const pr = prMap.get(exercise.exerciseId)

  return (
    <div className="rounded-2xl border border-border bg-bg-elevated p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-semibold text-fg">
            {exercise.exerciseName}
          </h3>
          {pr && (
            <p className="text-xs text-muted">
              PR: {pr.weightKg}kg × {pr.reps} reps ({pr.estimated1RM}kg e1RM)
            </p>
          )}
        </div>
        <button
          onClick={() => removeExercise(exercise.exerciseId)}
          className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:text-danger"
          aria-label="Eliminar ejercicio"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mb-2 flex items-center gap-2 text-[0.65rem] uppercase tracking-wider text-muted">
        <span className="w-8 text-center">Set</span>
        <span className="w-16 text-center">Peso</span>
        <span className="w-14 text-center">Reps</span>
        <span className="size-10" />
        <span className="size-10" />
      </div>

      <div className="space-y-2">
        {exercise.sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            isPR={pr ? set.weightKg * (36 / (37 - Math.max(set.reps, 1))) > pr.estimated1RM : false}
            onUpdate={(changes) => updateSet(exercise.exerciseId, set.id, changes)}
            onRemove={() => removeSet(exercise.exerciseId, set.id)}
          />
        ))}
      </div>

      <button
        onClick={() => addSet(exercise.exerciseId)}
        className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted transition-colors hover:border-accent/50 hover:text-accent"
      >
        <Plus className="size-4" />
        Añadir serie
      </button>
    </div>
  )
}
