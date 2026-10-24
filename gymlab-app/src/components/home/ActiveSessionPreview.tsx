// Resumen de la sesión activa en la home: series hechas por ejercicio, sin duplicar el hero.
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'

const MAX_ROWS = 3

export const ActiveSessionPreview = () => {
  const { t } = useTranslation()
  const exercises = useActiveWorkoutStore((s) => s.exercises)

  if (exercises.length === 0) return null

  const completed = exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.completed).length,
    0,
  )
  const total = exercises.reduce((count, exercise) => count + exercise.sets.length, 0)

  return (
    <section className="mt-5 border-t border-border/40 pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.19em] text-muted">
          {t('home.enEstaSesion')}
        </h2>
        <span className="text-[9px] text-muted">
          {t('home.seriesContadas', { completadas: completed, total })}
        </span>
      </div>

      <div className="mt-1">
        {exercises.slice(0, MAX_ROWS).map((exercise, index) => {
          const done = exercise.sets.filter((set) => set.completed).length
          const allDone = done === exercise.sets.length && exercise.sets.length > 0

          return (
            <div
              key={`${exercise.exerciseId}-${index}`}
              className="flex min-h-12 items-center gap-3 border-t border-border/40 py-2"
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-medium ${
                  allDone ? 'bg-success/15 text-success' : 'bg-gold/10 text-gold'
                }`}
              >
                {allDone ? <Check className="size-3" aria-hidden="true" /> : index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-fg">
                {exercise.exerciseName}
              </span>
              <span className="shrink-0 text-[11px] tabular-nums text-muted">
                {done}/{exercise.sets.length}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
