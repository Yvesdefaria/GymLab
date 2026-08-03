import { Check, Trash2 } from 'lucide-react'
import type { ActiveSet } from '@/store/activeWorkoutStore'

type SetRowProps = {
  set: ActiveSet
  isPR: boolean
  onUpdate: (changes: Partial<Pick<ActiveSet, 'weightKg' | 'reps' | 'completed'>>) => void
  onRemove: () => void
}

export const SetRow = ({ set, isPR, onUpdate, onRemove }: SetRowProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="flex w-8 items-center justify-center font-display text-sm font-semibold text-muted">
        {set.setNumber}
      </span>

      <input
        type="number"
        value={set.weightKg || ''}
        onChange={(e) => onUpdate({ weightKg: Number(e.target.value) })}
        placeholder="kg"
        className="h-10 w-16 rounded-lg border border-border bg-bg px-2 text-center text-sm text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none"
        inputMode="decimal"
      />

      <input
        type="number"
        value={set.reps || ''}
        onChange={(e) => onUpdate({ reps: Number(e.target.value) })}
        placeholder="reps"
        className="h-10 w-14 rounded-lg border border-border bg-bg px-2 text-center text-sm text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none"
        inputMode="numeric"
      />

      <button
        onClick={() => onUpdate({ completed: !set.completed })}
        className={`flex size-10 items-center justify-center rounded-lg transition-colors ${
          set.completed
            ? 'bg-success text-bg'
            : 'border border-border bg-bg text-muted hover:border-success/50'
        }`}
        aria-label={set.completed ? 'Marcar incompleta' : 'Marcar completada'}
      >
        <Check className="size-5" strokeWidth={set.completed ? 3 : 2} />
      </button>

      <button
        onClick={onRemove}
        className="flex size-10 items-center justify-center rounded-lg border border-border bg-bg text-danger/70 transition-colors hover:border-danger/50 hover:text-danger"
        aria-label="Eliminar serie"
      >
        <Trash2 className="size-4" />
      </button>

      {isPR && (
        <span className="rounded bg-cta/20 px-1.5 py-0.5 font-display text-[0.65rem] font-bold uppercase tracking-wider text-cta">
          PR
        </span>
      )}
    </div>
  )
}
