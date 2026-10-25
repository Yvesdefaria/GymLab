// Ejercicios del día seleccionado: filas hairline con índice, nombre y series×reps · descanso.
// La virtualización se mantiene porque las filas tienen altura fija (46 px).
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'
import type { RoutineDay } from '@/domain/types'
import type { RoutineItemWithNames } from '@/hooks/useRoutines'

// Altura fija de cada fila: nombre a la izquierda y carga a la derecha.
const ITEM_ROW_HEIGHT = 46

interface RoutineDayPanelProps {
  day: RoutineDay
  items: RoutineItemWithNames[]
  isCustom: boolean
  editPath: string
  etaMin: number
}

export const RoutineDayPanel = ({ day, items, isCustom, editPath, etaMin }: RoutineDayPanelProps) => {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ITEM_ROW_HEIGHT,
    overscan: 6,
  })

  return (
    <section className="border-t border-border/40 pt-3">
      <div className="flex items-baseline justify-between gap-3 pb-1">
        <h3 className="min-w-0 truncate font-display text-[13px] font-medium text-fg">{day.name}</h3>
        {items.length > 0 ? (
          <span className="shrink-0 text-[10px] tabular-nums text-muted">
            {t('rutinas.ejercicios', { count: items.length })} ·{' '}
            {t('rutinas.detalle.duracionDia', { min: etaMin })}
          </span>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div ref={scrollRef} className="max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <div style={{ height: virtualizer.getTotalSize() }} className="relative">
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = items[virtualRow.index]
              return (
                <div
                  key={virtualRow.key}
                  style={{ height: virtualRow.size, transform: `translateY(${virtualRow.start}px)` }}
                  className="absolute left-0 top-0 w-full"
                >
                  <div className="flex h-full items-center gap-3 border-b border-border/30">
                    <span className="w-4 shrink-0 text-[9px] tabular-nums text-muted/70">
                      {String(virtualRow.index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-fg">
                      {item.exerciseSlug ? (
                        <Link
                          to={`/ejercicios/${item.exerciseSlug}`}
                          className="underline-offset-4 transition-colors hover:text-accent-soft hover:underline"
                        >
                          {item.exerciseName ?? t('rutinas.day.ejercicioNum', { id: item.exerciseId })}
                        </Link>
                      ) : (
                        item.exerciseName ?? t('rutinas.day.ejercicioNum', { id: item.exerciseId })
                      )}
                    </span>
                    <span className="shrink-0 text-[10px] tabular-nums text-muted">
                      <b className="font-semibold text-accent-soft">
                        {item.targetSets}×{item.targetReps}
                      </b>{' '}
                      · {item.restSec}s
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
    </section>
  )
}
