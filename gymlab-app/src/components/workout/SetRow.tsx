import { Check, Trash2 } from 'lucide-react'
import type { ActiveSet } from '@/store/activeWorkoutStore'
import type { Units } from '@/domain/settings'
import { applyUnits, parseWeightToKg, formatUnits } from '@/domain/settings'
import { clamp } from '@/domain/numberGuard'

const MAX_WEIGHT_KG = 1000
const MAX_REPS = 1000

type SetRowProps = {
  set: ActiveSet
  isPR: boolean
  showRpe?: boolean
  showRir?: boolean
  units: Units
  onUpdate: (
    changes: Partial<Pick<ActiveSet, 'weightKg' | 'reps' | 'completed' | 'rpe' | 'rir'>>
  ) => void
  onRemove: () => void
  onComplete?: (completed: boolean) => void
}

export const SetRow = ({ set, isPR, showRpe, showRir, units, onUpdate, onRemove, onComplete }: SetRowProps) => {
  const warmup = Boolean(set.isWarmup)

  const handleToggleComplete = () => {
    const next = !set.completed
    onUpdate({ completed: next })
    onComplete?.(next)
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-1 ${
        warmup ? 'bg-cta/5' : ''
      } ${set.completed ? 'animate-row-flash opacity-70' : ''}`}
    >
      <span className="flex w-8 shrink-0 items-center justify-center font-display text-sm font-semibold text-muted">
        {set.setNumber}
        {warmup && <span className="sr-only"> (calentamiento)</span>}
      </span>

      <input
        type="number"
        min={0}
        max={MAX_WEIGHT_KG}
        value={set.weightKg ? applyUnits(set.weightKg, units) : ''}
        onChange={(e) =>
          onUpdate({
            weightKg: e.target.value === '' ? 0 : clamp(parseWeightToKg(Number(e.target.value), units), 0, MAX_WEIGHT_KG),
          })
        }
        placeholder={formatUnits(units)}
        className={`h-10 w-16 rounded-lg border bg-bg px-2 text-center text-sm text-fg placeholder:text-muted/50 focus:outline-none ${
          warmup ? 'border-cta/40' : 'border-border focus:border-cta'
        }`}
        inputMode="decimal"
        aria-label={`Peso en ${formatUnits(units)}`}
      />

      <input
        type="number"
        min={0}
        max={MAX_REPS}
        value={set.reps || ''}
        onChange={(e) => onUpdate({ reps: e.target.value === '' ? 0 : clamp(Number(e.target.value), 0, MAX_REPS) })}
        placeholder="reps"
        className="h-10 w-14 rounded-lg border border-border bg-bg px-2 text-center text-sm text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none"
        inputMode="numeric"
      />

      {showRpe && (
        <input
          type="number"
          value={set.rpe ?? ''}
          onChange={(e) => onUpdate({ rpe: e.target.value === '' ? undefined : clamp(Number(e.target.value), 4, 10) })}
          placeholder="RPE"
          min={4}
          max={10}
          className="h-10 w-12 rounded-lg border border-border bg-bg px-1 text-center text-xs text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none"
          inputMode="decimal"
          aria-label="RPE de la serie"
        />
      )}

      {showRir && (
        <input
          type="number"
          value={set.rir ?? ''}
          onChange={(e) => onUpdate({ rir: e.target.value === '' ? undefined : clamp(Number(e.target.value), 0, 6) })}
          placeholder="RIR"
          min={0}
          max={6}
          className="h-10 w-12 rounded-lg border border-border bg-bg px-1 text-center text-xs text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none"
          inputMode="numeric"
          aria-label="RIR de la serie"
        />
      )}

      <button
        onClick={handleToggleComplete}
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
          set.completed
            ? 'animate-pop bg-cta text-on-gold shadow-[0_0_16px_-3px_color-mix(in_srgb,var(--color-cta)_75%,transparent)]'
            : 'border border-border bg-bg text-muted hover:border-cta/60 hover:text-accent-soft'
        }`}
        aria-label={set.completed ? 'Marcar incompleta' : 'Marcar completada'}
      >
        <Check className="size-5" strokeWidth={set.completed ? 3 : 2} />
      </button>

      <button
        onClick={onRemove}
        className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-bg text-danger/70 transition-colors hover:border-danger/50 hover:text-danger"
        aria-label="Eliminar serie"
      >
        <Trash2 className="size-4" />
      </button>

      {isPR && (
        <span className="rounded bg-cta/20 px-1.5 py-0.5 font-display text-[0.65rem] font-bold uppercase tracking-wider text-cta shadow-[0_0_10px_-2px_color-mix(in_srgb,var(--color-cta)_65%,transparent)]">
          PR
        </span>
      )}
      {warmup && (
        <span className="rounded bg-cta/10 px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-cta">
          Cal
        </span>
      )}
    </div>
  )
}
