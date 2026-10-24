// «Rutina de hoy»: las primeras filas del día programado, con acceso a la rutina completa.
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { estimateWorkoutMinutes } from '@/domain/calendar'
import type { RoutineItemWithNames } from '@/hooks/useRoutines'

type Props = {
  items: RoutineItemWithNames[]
  routineSlug?: string
}

const MAX_ROWS = 3

export const TodayRoutine = ({ items, routineSlug }: Props) => {
  const { t } = useTranslation()
  if (items.length === 0) return null

  const countLabel =
    items.length === 1
      ? t('home.ejercicioSingular')
      : t('home.ejerciciosCount', { count: items.length })
  const minutes = estimateWorkoutMinutes(items)

  return (
    <section className="mt-5 border-t border-border/40 pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.19em] text-muted">
          {t('home.rutinaDeHoy')}
        </h2>
        <span className="text-[9px] text-muted">
          {countLabel}
          {t('home.minSufijo', { min: `~${minutes}` })}
        </span>
      </div>

      <div className="mt-1">
        {items.slice(0, MAX_ROWS).map((item, index) => (
          <div key={item.id} className="flex min-h-12 items-center gap-3 border-t border-border/40 py-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/10 text-[9px] font-medium text-gold">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-fg">
                {item.exerciseName ?? t('home.ejercicioFallback', { id: item.exerciseId })}
              </span>
              {item.exerciseMuscleGroup && (
                <span className="mt-0.5 block truncate text-[9.5px] text-muted">
                  {item.exerciseMuscleGroup}
                </span>
              )}
            </span>
            <span className="shrink-0 text-[11px] tabular-nums text-muted">
              {item.targetSets} × {item.targetReps}
            </span>
          </div>
        ))}
      </div>

      {routineSlug && (
        <Link
          to={`/rutinas/${routineSlug}`}
          className="mt-2 flex min-h-[44px] items-center justify-between text-[10.5px] font-medium text-gold-bright"
        >
          <span>{t('home.verRutinaCompleta')}</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </section>
  )
}
