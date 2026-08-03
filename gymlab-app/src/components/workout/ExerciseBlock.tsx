import { CheckCheck, Plus, X } from 'lucide-react'
import { SetRow } from './SetRow'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import type { ActiveExercise, ActiveSet } from '@/store/activeWorkoutStore'

type ExerciseBlockProps = {
  exercise: ActiveExercise
  prMap: Map<number, { weightKg: number; reps: number; estimated1RM: number }>
  showRpe?: boolean
  onCompleteExercise?: () => void
  onSetCompleted?: (set: ActiveSet, completed: boolean) => void
  onRemoveRequest?: (exerciseId: number) => void
  onSetRemoveRequest?: (exerciseId: number, setId: string) => void
}

export const ExerciseBlock = ({
  exercise,
  prMap,
  showRpe,
  onCompleteExercise,
  onSetCompleted,
  onRemoveRequest,
  onSetRemoveRequest,
}: ExerciseBlockProps) => {
  const { addSet, removeSet, updateSet, removeExercise } = useActiveWorkoutStore()
  const pr = prMap.get(exercise.exerciseId)
  const allDone = exercise.sets.length > 0 && exercise.sets.every((s) => s.completed)

  return (
    <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
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
        <div className="flex shrink-0 gap-1">
          {onCompleteExercise && !allDone ? (
            <button
              type="button"
              onClick={onCompleteExercise}
              className="flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-xs text-success transition-colors hover:bg-success/10"
              aria-label="Finalizar ejercicio"
            >
              <CheckCheck className="size-4" />
              Listo
            </button>
          ) : null}
          <button
            onClick={() => (onRemoveRequest ? onRemoveRequest(exercise.exerciseId) : removeExercise(exercise.exerciseId))}
            className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors hover:text-danger"
            aria-label="Eliminar ejercicio"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="mb-2 flex items-center gap-2 text-[0.65rem] uppercase tracking-wider text-muted">
        <span className="w-8 shrink-0 text-center">Set</span>
        <span className="w-16 text-center">Peso</span>
        <span className="w-14 text-center">Reps</span>
        {showRpe && <span className="w-12 text-center">RPE</span>}
        <span className="size-10 shrink-0" />
        <span className="size-10 shrink-0" />
        <span className="size-12" />
      </div>

      <div className="space-y-2">
        {exercise.sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            showRpe={showRpe}
            isPR={pr ? set.weightKg * (36 / (37 - Math.max(set.reps, 1))) > pr.estimated1RM : false}
            onUpdate={(changes) => updateSet(exercise.exerciseId, set.id, changes)}
            onRemove={() =>
              onSetRemoveRequest
                ? onSetRemoveRequest(exercise.exerciseId, set.id)
                : removeSet(exercise.exerciseId, set.id)
            }
            onComplete={(completed) => onSetCompleted?.(set, completed)}
          />
        ))}
      </div>

      <button
        onClick={() => addSet(exercise.exerciseId)}
        className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gold/40 text-sm text-muted transition-colors hover:border-cta hover:text-accent-soft"
      >
        <Plus className="size-4" />
        Añadir serie
      </button>
    </div>
  )
}
