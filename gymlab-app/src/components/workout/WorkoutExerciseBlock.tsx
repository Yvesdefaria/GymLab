// Fila de ejercicio read-only (detalle de sesión guardada): cabecera con PR/nota y series con RPE/RIR,
// reutilizada por WorkoutDetail. La sesión activa usa ExerciseBlock (interactivo), no este componente.
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
  // Nota opcional: WorkoutDetail aún no la pasa — las notas por ejercicio viven en días de rutina,
  // no se persisten por sesión; la prop queda disponible para futuros consumidores con ese dato.
  note?: string
}

export const WorkoutExerciseBlock = ({ name, sets, pr, units, note }: WorkoutExerciseBlockProps) => {
  const { t } = useTranslation()
  return (
    <div className="panel-light rounded-2xl p-4">
      <div className="mb-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">{name}</h2>
        {pr && (
          <p className="mt-1 text-xs text-muted">
            {t('workout.prTexto', {
              peso: formatWeight(pr.weightKg, units),
              reps: pr.reps,
              e1rm: formatWeight(pr.estimated1RM, units),
            })}
          </p>
        )}
        {note && <p className="mt-1 text-xs italic text-muted">{t('workout.nota', { nota: note })}</p>}
      </div>
      <div className="space-y-1.5">
        {sets.map((set) => {
          const isCardioSet = set.durationSeconds !== undefined || set.distanceMeters !== undefined
          return (
            <div key={set.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex w-8 shrink-0 items-center gap-1 text-xs text-muted">
                {set.isWarmup ? (
                  <span className="rounded-full border border-cta/40 bg-cta/10 px-2 py-0.5 text-[0.65rem] font-semibold text-accent-soft">
                    CAL
                  </span>
                ) : (
                  `#${set.setNumber}`
                )}
              </span>
              {isCardioSet ? (
                <span className="min-w-0 flex-1 text-right font-semibold text-fg">
                  {formatDuration(set.durationSeconds ?? 0)}
                  {set.distanceMeters !== undefined && ` · ${set.distanceMeters} m`}
                </span>
              ) : (
                <span className="min-w-0 flex-1 text-right font-semibold text-fg">
                  {formatWeight(set.weightKg, units)} × {set.reps}
                </span>
              )}
              {set.rpe !== undefined && (
                <span className="w-10 shrink-0 text-right text-xs text-muted">
                  {t('workout.rpeValor', { rpe: set.rpe })}
                </span>
              )}
              {set.rir !== undefined && (
                <span className="w-10 shrink-0 text-right text-xs text-muted">
                  {t('workout.rirValor', { rir: set.rir })}
                </span>
              )}
              {set.completed ? (
                <span className="w-5 shrink-0 text-xs text-success" aria-label={t('workout.completada')}>
                  ✓
                </span>
              ) : (
                <span className="w-5 shrink-0 text-xs text-muted" aria-label={t('workout.sinCompletar')}>
                  –
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}