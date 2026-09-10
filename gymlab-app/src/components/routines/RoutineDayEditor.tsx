// Sección de un día del builder: nombre, lista de ejercicios (targets, superserie) y añadir ejercicio.
import { useTranslation } from 'react-i18next'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { Panel } from '@/components/ui/Panel'
import type { RoutineDraftDay } from '@/domain/routines'
import { ExerciseItem } from './ExerciseItem'

interface RoutineDayEditorProps {
  day: RoutineDraftDay
  dayIndex: number
  onRenameDay: (name: string) => void
  onRemoveDay: () => void
  onPickExercise: () => void
  onUpdateItem: (
    itemIndex: number,
    patch: Partial<{ targetSets: number; targetReps: number; restSec: number; supersetGroup: string }>
  ) => void
  onRemoveItem: (itemIndex: number) => void
  // Grip de reorden de días; solo se renderiza cuando el builder tiene más de un día.
  dayDrag?: {
    onDragStart: (e: React.PointerEvent) => void
  }
  drag: {
    isDragging: (itemIndex: number) => boolean
    isOver: (itemIndex: number) => boolean
    onDragStart: (itemIndex: number, e: React.PointerEvent) => void
    onDragMove: (e: React.PointerEvent) => void
    onDragEnd: () => void
    registerItemRef: (key: string, el: HTMLDivElement | null) => void
  }
}

export const RoutineDayEditor = ({
  day,
  dayIndex,
  onRenameDay,
  onRemoveDay,
  onPickExercise,
  onUpdateItem,
  onRemoveItem,
  dayDrag,
  drag,
}: RoutineDayEditorProps) => {
  const { t } = useTranslation()

  return (
    <Panel as="section">
      <div className="mb-3 flex items-center gap-2">
        {dayDrag ? (
          <button
            type="button"
            onPointerDown={dayDrag.onDragStart}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted touch-none"
            aria-label={t('rutinas.builder.reordenarDia')}
          >
            <GripVertical className="size-5" />
          </button>
        ) : null}
        <label htmlFor={`day-name-${dayIndex}`} className="sr-only">
          {t('rutinas.builder.nombreDia')}
        </label>
        <input
          id={`day-name-${dayIndex}`}
          type="text"
          value={day.name}
          onChange={(e) => onRenameDay(e.target.value)}
          className="h-11 flex-1 rounded-xl border border-border bg-bg-elevated px-3 text-sm font-medium text-fg focus:border-cta focus:outline-none"
        />
        <button
          type="button"
          onClick={onRemoveDay}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-danger"
          aria-label={t('rutinas.builder.eliminarDia')}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="space-y-2">
        {day.items.map((item, itemIndex) => (
          <ExerciseItem
            key={itemIndex}
            dayIndex={dayIndex}
            itemIndex={itemIndex}
            item={item}
            isDragging={drag.isDragging(itemIndex)}
            isOver={drag.isOver(itemIndex)}
            onDragStart={(e) => drag.onDragStart(itemIndex, e)}
            onDragMove={drag.onDragMove}
            onDragEnd={drag.onDragEnd}
            onRemove={() => onRemoveItem(itemIndex)}
            onUpdate={(patch) => onUpdateItem(itemIndex, patch)}
            registerRef={(el) => drag.registerItemRef(`${dayIndex}-${itemIndex}`, el)}
            t={t}
          />
        ))}

        <button
          type="button"
          onClick={onPickExercise}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gold/50 text-sm text-accent-soft"
        >
          <Plus className="size-4" /> {t('rutinas.builder.anadirEjercicio')}
        </button>
      </div>
    </Panel>
  )
}