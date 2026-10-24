// F132.2/Q2 — fila de ejercicio read-only del detalle guardado: hairline, sin tarjeta.
// Conserva el PR, las series con RPE/RIR, cardio y el check/dash de completada.
import { useTranslation } from 'react-i18next'
import { formatDuration } from '@/lib/duration'
import { formatWeight } from '@/domain/settings'
import type { WorkoutSet } from '@/domain/types'
import type { Units } from '@/domain/settings'

type SetView = Pick<
  WorkoutSet,
  'id' | 'setNumber' | 'weightKg' | 'reps' | 'completed' | 'rpe' | 'rir' | 'isWarmup' | 'durationSeconds' | 'distanceMeters'
>

type WorkoutExerciseBlockProps = {
  name: string
  sets: ReadonlyArray<SetView>
  pr?: { weightKg: number; reps: number; estimated1RM: number }
  units: Units
  // Categoría del ejercicio en el catálogo: gobierna si la serie se muestra como
  // cardio (duración/distancia) o como fuerza (peso × reps). No se deduce de la serie.
  isCardio: boolean
  // Nota opcional: WorkoutDetail aún no la pasa — las notas por ejercicio viven en días de rutina,
  // no se persisten por sesión; la prop queda disponible para futuros consumidores con ese dato.
  note?: string
}

export const WorkoutExerciseBlock = ({ name, sets, pr, units, isCardio, note }: WorkoutExerciseBlockProps) => {
  const { t } = useTranslation()
  return (
    <section className="border-t border-border/40 py-3">
      <div className="mb-2">
        <h2 className="font-display text-lg font-medium tracking-wide text-fg">{name}</h2>
        {pr && (
          <p className="mt-0.5 text-[10px] text-success">
            {t('workout.prTexto', {
              peso: formatWeight(pr.weightKg, units),
              reps: pr.reps,
              e1rm: formatWeight(pr.estimated1RM, units),
            })}
          </p>
        )}
        {note && <p className="mt-1 text-xs italic text-muted">{t('workout.nota', { nota: note })}</p>}
      </div>
      <div>
        {sets.map((set) => {
          const isCardioSet = isCardio
          return (
            <div
              key={set.id}
              className="flex min-h-7 items-center justify-between gap-3 border-t border-border/25 py-1.5 text-sm first:border-t-0"
            >
              <span className="flex w-8 shrink-0 items-center gap-1 text-[10px] text-muted">
                {set.isWarmup ? (
                  <span className="rounded-full border border-cta/40 bg-cta/10 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide text-accent-soft">
                    {t('workout.cal')}
                  </span>
                ) : (
                  `#${set.setNumber}`
                )}
              </span>
              {isCardioSet ? (
                <span className="min-w-0 flex-1 text-right font-display text-sm tabular-nums text-fg">
                  {formatDuration(set.durationSeconds ?? 0)}
                  {set.distanceMeters !== undefined && ` · ${set.distanceMeters} m`}
                </span>
              ) : (
                <span className="min-w-0 flex-1 text-right font-display text-sm tabular-nums text-fg">
                  {formatWeight(set.weightKg, units)} × {set.reps}
                </span>
              )}
              {set.rpe !== undefined && (
                <span className="w-10 shrink-0 text-right text-[10px] text-muted">
                  {t('workout.rpeValor', { rpe: set.rpe })}
                </span>
              )}
              {set.rir !== undefined && (
                <span className="w-10 shrink-0 text-right text-[10px] text-muted">
                  {t('workout.rirValor', { rir: set.rir })}
                </span>
              )}
              {set.completed ? (
                <span className="w-5 shrink-0 text-right text-xs text-success" aria-label={t('workout.completada')}>
                  ✓
                </span>
              ) : (
                <span className="w-5 shrink-0 text-right text-xs text-muted" aria-label={t('workout.sinCompletar')}>
                  –
                </span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
