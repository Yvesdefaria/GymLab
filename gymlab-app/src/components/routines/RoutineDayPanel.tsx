// Panel con los ejercicios de un día de rutina: lista de ejercicios con enlaces a ficha,
// series/reps/descanso y estado vacío con link al editor si es rutina propia.
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'
import type { RoutineDay } from '@/domain/types'
import type { RoutineItemWithNames } from '@/hooks/useRoutines'

// Altura estimada de cada fila de ejercicio en el panel de detalle.
const ITEM_ROW_HEIGHT = 36

interface RoutineDayPanelProps {
  day: RoutineDay
  items: RoutineItemWithNames[]
  isCustom: boolean
  editPath: string
}

export const RoutineDayPanel = ({ day, items, isCustom, editPath }: RoutineDayPanelProps) => {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ITEM_ROW_HEIGHT,
    gap: 8,
    overscan: 10,
  })

  return (
    <div className="panel-light rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <Calendar className="size-4 text-accent" />
        <h3 className="font-display text-sm font-semibold text-accent">{day.name}</h3>
      </div>
      {items.length > 0 ? (
        <div
          ref={scrollRef}
          className="max-h-[60vh] overflow-y-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          <div
            style={{ height: virtualizer.getTotalSize() }}
            className="relative"
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = items[virtualRow.index]
              const isLast = virtualRow.index === items.length - 1
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="absolute left-0 top-0 w-full"
                >
                  <div
                    className={`flex h-full items-center justify-between pb-2 ${
                      isLast ? '' : 'border-b border-border/30'
                    }`}
                  >
                    <span className="min-w-0 text-sm text-fg">
                      {item.exerciseSlug ? (
                        <Link
                          to={`/ejercicios/${item.exerciseSlug}`}
                          className="inline-block max-w-full truncate text-fg underline-offset-4 transition-colors hover:text-accent-soft hover:underline"
                        >
                          {item.exerciseName ?? t('rutinas.day.ejercicioNum', { id: item.exerciseId })}
                        </Link>
                      ) : (
                        item.exerciseName ?? t('rutinas.day.ejercicioNum', { id: item.exerciseId })
                      )}
                    </span>
                    <span className="text-xs text-muted">
                      {item.targetSets}×{item.targetReps} · {item.restSec}s
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          size="sm"
          message={t('rutinas.day.sinEjercicios')}
          action={
            isCustom ? (
              <Link to={editPath} className="text-accent-soft underline underline-offset-2">
                {t('rutinas.day.anadirEditor')}.
              </Link>
            ) : undefined
          }
        />
      )}
    </div>
  )
}
