// Día del builder en hairline: encabezado con grip/nombre/papelera y ejercicios en
// filas compactas que se expanden de a una (acordeón por día).
import { memo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
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
  // Una fila abierta por día: mantiene la lista corta y el foco en un ejercicio.
  const [openItem, setOpenItem] = useState<number | null>(null)
  // La fila abierta se guarda por posición, así que al agregar, quitar o reordenar
  // ejercicios se cierra: si no, el panel pasaría a editar otro ejercicio.
  const itemOrderKey = day.items.map((item) => item.exerciseId).join(',')
  useEffect(() => {
    setOpenItem(null)
  }, [itemOrderKey])

  return (
    <section className="border-t border-border/40 pt-2">
      <div className="flex items-center gap-1">
        {dayDrag ? (
          <button
            type="button"
            onPointerDown={dayDrag.onDragStart}
            className="flex size-11 shrink-0 items-center justify-center text-muted touch-none"
            aria-label={t('rutinas.builder.reordenarDia')}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        ) : null}
        <span className="w-4 shrink-0 text-[9px] tabular-nums text-muted/70">
          {String(dayIndex + 1).padStart(2, '0')}
        </span>
        <label htmlFor={`day-name-${dayIndex}`} className="sr-only">
          {t('rutinas.builder.nombreDia')}
        </label>
        <input
          id={`day-name-${dayIndex}`}
          type="text"
          value={day.name}
          onChange={(e) => onRenameDay(e.target.value)}
          className="min-h-[44px] min-w-0 flex-1 bg-transparent px-1 font-display text-[15px] text-fg focus:outline-none"
        />
        <button
          type="button"
          onClick={onRemoveDay}
          className="flex size-11 shrink-0 items-center justify-center text-danger"
          aria-label={t('rutinas.builder.eliminarDia')}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>

      {day.items.map((item, itemIndex) => (
        <ExerciseItem
          key={itemIndex}
          dayIndex={dayIndex}
          itemIndex={itemIndex}
          item={item}
          expanded={openItem === itemIndex}
          isDragging={drag.isDragging(itemIndex)}
          isOver={drag.isOver(itemIndex)}
          onToggle={() => setOpenItem((prev) => (prev === itemIndex ? null : itemIndex))}
          onDragStart={(e) => drag.onDragStart(itemIndex, e)}
          onDragMove={drag.onDragMove}
          onDragEnd={drag.onDragEnd}
          onRemove={() => {
            setOpenItem(null)
            onRemoveItem(itemIndex)
          }}
          onUpdate={(patch) => onUpdateItem(itemIndex, patch)}
          registerRef={(el) => drag.registerItemRef(`${dayIndex}-${itemIndex}`, el)}
          t={t}
        />
      ))}

      <button
        type="button"
        onClick={onPickExercise}
        className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gold/50 text-sm text-accent-soft"
      >
        <Plus className="size-4" aria-hidden /> {t('rutinas.builder.anadirEjercicio')}
      </button>
    </section>
  )
})
RoutineDayEditor.displayName = 'RoutineDayEditor'
