// Fila de ejercicio del builder: colapsada muestra nombre y carga; expandida deja
// editar series, reps, descanso y superserie. El grip reordena sin abrir la fila.
import { memo } from 'react'
import { ChevronRight, GripVertical, Trash2 } from 'lucide-react'
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
  expanded: boolean
  isDragging: boolean
  isOver: boolean
  onToggle: () => void
  onDragStart: (e: React.PointerEvent) => void
  onDragMove: (e: React.PointerEvent) => void
  onDragEnd: () => void
  onRemove: () => void
  onUpdate: (patch: Partial<{ targetSets: number; targetReps: number; restSec: number; supersetGroup: string }>) => void
  registerRef: (el: HTMLDivElement | null) => void
  t: any
}

export const ExerciseItem = memo(({
  dayIndex,
  itemIndex,
  item,
  expanded,
  isDragging,
  isOver,
  onToggle,
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
    className={`border-b border-border/30 transition-colors ${
      isDragging ? 'opacity-60' : isOver ? 'bg-accent/5' : ''
    }`}
  >
    <div className="flex items-center gap-1">
      <button
        type="button"
        onPointerDown={onDragStart}
        className="flex size-11 shrink-0 items-center justify-center text-muted touch-none"
        aria-label={t('rutinas.builder.reorder') as string}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className="min-w-0 flex-1 truncate text-[13px] text-fg">{item.exerciseName}</span>
        <span className="shrink-0 text-[10px] tabular-nums text-muted">
          <b className="font-semibold text-accent-soft">
            {item.targetSets}×{item.targetReps}
          </b>{' '}
          · {item.restSec}s
        </span>
        <ChevronRight
          className={`size-4 shrink-0 text-muted transition-transform ${expanded ? 'rotate-90' : ''}`}
          aria-hidden
        />
      </button>
    </div>

    {expanded ? (
      <div className="pb-3 pl-12 pr-1">
        <div className="grid grid-cols-3 gap-2">
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
            onChange={(e) => onUpdate({ supersetGroup: e.target.value || undefined })}
            className="h-11 rounded-xl border border-border bg-bg-elevated px-2 text-sm text-fg focus:border-cta focus:outline-none"
          >
            <option value="">—</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
          <p className="text-[0.65rem] text-muted">{t('rutinas.builder.superserieAyuda')}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="mt-1 inline-flex min-h-[44px] items-center gap-1.5 text-[11px] text-danger"
        >
          <Trash2 className="size-4" aria-hidden /> {t('rutinas.builder.quitarEjercicio')}
        </button>
      </div>
    ) : null}
  </div>
))
ExerciseItem.displayName = 'ExerciseItem'
