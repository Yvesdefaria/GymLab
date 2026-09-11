// Sección de un día del builder: nombre, lista de ejercicios (targets, superserie) y añadir ejercicio.
import { memo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useVirtualizer } from '@tanstack/react-virtual'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { Panel } from '@/components/ui/Panel'
import type { RoutineDraftDay } from '@/domain/routines'
import { ExerciseItem } from './ExerciseItem'

// Altura estimada de cada ExerciseItem para el virtualizador (header + grid de inputs + superserie).
const EXERCISE_ITEM_HEIGHT = 200

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

export const RoutineDayEditor = memo(({
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
  const scrollRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: day.items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => EXERCISE_ITEM_HEIGHT,
    gap: 8,
    overscan: 5,
  })

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

      {day.items.length > 0 && (
        <div
          ref={scrollRef}
          className="max-h-[70vh] overflow-y-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          <div
            style={{ height: virtualizer.getTotalSize() }}
            className="relative"
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const itemIndex = virtualRow.index
              const item = day.items[itemIndex]
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="absolute left-0 top-0 w-full"
                >
                  <ExerciseItem
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
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onPickExercise}
        className={`${day.items.length > 0 ? 'mt-2' : ''} flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gold/50 text-sm text-accent-soft`}
      >
        <Plus className="size-4" /> {t('rutinas.builder.anadirEjercicio')}
      </button>
    </Panel>
  )
})
RoutineDayEditor.displayName = 'RoutineDayEditor'