import { GripVertical, Trash2 } from 'lucide-react'
import { TargetInput } from './TargetInput'
import { TARGET_BOUNDS } from '@/domain/routines'

interface ExerciseItemProps {
  dayIndex: number
  itemIndex: number
  item: {
    exerciseName: string
    targetSets: number
    targetReps: number
    restSec: number
    supersetGroup?: string
  }
  isDragging: boolean
  isOver: boolean
  onDragStart: (e: React.PointerEvent) => void
  onDragMove: (e: React.PointerEvent) => void
  onDragEnd: () => void
  onRemove: () => void
  onUpdate: (patch: Partial<{ targetSets: number; targetReps: number; restSec: number; supersetGroup: string }>) => void
  registerRef: (el: HTMLDivElement | null) => void
  t: any
}

export const ExerciseItem = ({
  dayIndex,
  itemIndex,
  item,
  isDragging,
  isOver,
  onDragStart,
  onDragMove,
  onDragEnd,
  onRemove,
  onUpdate,
  registerRef,
  t,
}: ExerciseItemProps) => (
  <div
    ref={registerRef}
    onPointerMove={onDragMove}
    onPointerUp={onDragEnd}
    className={`rounded-xl border p-3 transition-colors ${
      isDragging
        ? 'border-accent bg-accent/10 opacity-80'
        : isOver
          ? 'border-accent/50 border-dashed bg-accent/5'
          : 'border-border/30 bg-bg-elevated/30'
    }`}
  >
    <div className="flex items-center gap-2">
      <button
        type="button"
        onPointerDown={onDragStart}
        className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted touch-none"
        aria-label={t('rutinas.builder.reorder') as string}
      >
        <GripVertical className="size-5" />
      </button>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{item.exerciseName}</span>
      <button
        type="button"
        onClick={onRemove}
        className="flex size-11 shrink-0 items-center justify-center rounded-lg text-danger"
        aria-label={t('rutinas.builder.quitarEjercicio')}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
    <div className="mt-2 grid grid-cols-3 gap-2">
      {(
        [
          ['rutinas.builder.series', 'targetSets'],
          ['rutinas.builder.reps', 'targetReps'],
          ['rutinas.builder.descanso', 'restSec'],
        ] as const
      ).map(([labelKey, key]) => (
        <TargetInput
          key={key}
          id={`target-${dayIndex}-${itemIndex}-${key}`}
          value={item[key]}
          bounds={TARGET_BOUNDS[key]}
          label={t(labelKey)}
          onChange={(value) => onUpdate({ [key]: value })}
        />
      ))}
    </div>
    <div className="mt-2 flex items-center gap-2">
      <label htmlFor={`superset-${dayIndex}-${itemIndex}`} className="text-[0.65rem] uppercase text-muted">
        {t('rutinas.builder.superserie')}
      </label>
      <select
        id={`superset-${dayIndex}-${itemIndex}`}
        value={item.supersetGroup ?? ''}
        onChange={(e) =>
          onUpdate({ supersetGroup: e.target.value || undefined })
        }
        className="h-11 rounded-xl border border-border bg-bg-elevated px-2 text-sm text-fg focus:border-cta focus:outline-none"
      >
        <option value="">—</option>
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
        <option value="D">D</option>
      </select>
      <p className="text-[0.65rem] text-muted">
        {t('rutinas.builder.superserieAyuda')}
      </p>
    </div>
  </div>
)
