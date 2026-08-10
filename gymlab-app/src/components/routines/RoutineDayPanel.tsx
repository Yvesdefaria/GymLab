// Panel con los ejercicios de un día de rutina: lista de ejercicios con enlaces a ficha,
// series/reps/descanso y estado vacío con link al editor si es rutina propia.
import { Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { RoutineDay } from '@/domain/types'
import type { RoutineItemWithNames } from '@/hooks/useRoutines'

interface RoutineDayPanelProps {
  day: RoutineDay
  items: RoutineItemWithNames[]
  isCustom: boolean
  editPath: string
}

export const RoutineDayPanel = ({ day, items, isCustom, editPath }: RoutineDayPanelProps) => {
  return (
    <div className="panel rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <Calendar className="size-4 text-accent" />
        <h3 className="font-display text-sm font-semibold text-accent">{day.name}</h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0"
          >
            <span className="min-w-0 text-sm text-fg">
              {item.exerciseSlug ? (
                <Link
                  to={`/ejercicios/${item.exerciseSlug}`}
                  className="inline-block max-w-full truncate text-fg underline-offset-4 transition-colors hover:text-accent-soft hover:underline"
                >
                  {item.exerciseName ?? `Ejercicio #${item.exerciseId}`}
                </Link>
              ) : (
                item.exerciseName ?? `Ejercicio #${item.exerciseId}`
              )}
            </span>
            <span className="text-xs text-muted">
              {item.targetSets}×{item.targetReps} · {item.restSec}s
            </span>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <p className="rounded-xl border border-dashed border-border/60 bg-bg/40 px-3 py-4 text-center text-xs text-muted">
          Este día aún no tiene ejercicios.
          {isCustom && (
            <>
              {' '}
              <Link
                to={editPath}
                className="text-accent-soft underline underline-offset-2"
              >
                Añádelos en el editor
              </Link>
              .
            </>
          )}
        </p>
      )}
    </div>
  )
}
