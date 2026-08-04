import { Link } from 'react-router-dom'
import { ArrowLeft, Clock, Dumbbell, Flame } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppHeader } from '@/components/layout/AppHeader'
import { workoutRepo, workoutSetRepo, exerciseRepo } from '@/data/repositories'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatWeight, formatUnits } from '@/domain/settings'

type WorkoutDetailProps = {
  workoutId: number
}

export const WorkoutDetail = ({ workoutId }: WorkoutDetailProps) => {
  const { settings } = useSettings()
  const workout = useLiveQuery(() => workoutRepo.getById(workoutId), [workoutId])
  const sets = useLiveQuery(() => workoutSetRepo.getByWorkout(workoutId), [workoutId]) ?? []
  const exercises = useLiveQuery(() => exerciseRepo.getAll(), []) ?? []
  const nameById = new Map(exercises.map((e) => [e.id, e.name]))

  if (!workout) {
    return (
      <div>
        <AppHeader title="Sesión" subtitle="Historial" />
        <div className="p-4">
          <div className="rounded-2xl border border-dashed border-gold/40 bg-bg-elevated/50 p-8 text-center">
            <p className="font-display text-base font-semibold text-fg">Sesión no encontrada</p>
            <p className="mt-1 text-sm text-muted">Puede que se haya borrado.</p>
            <Link
              to="/perfil"
              className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border bg-bg-elevated px-4 text-sm text-accent-soft"
            >
              <ArrowLeft className="size-4" aria-hidden /> Volver al historial
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const dateLabel = new Date(workout.startedAt).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const durationMin =
    workout.finishedAt !== null
      ? Math.max(0, Math.round((new Date(workout.finishedAt).getTime() - new Date(workout.startedAt).getTime()) / 60000))
      : null
  const completedSets = sets.filter((s) => s.completed).length
  const setsByExercise = new Map<number, typeof sets>()
  for (const s of sets) {
    const list = setsByExercise.get(s.exerciseId) ?? []
    list.push(s)
    setsByExercise.set(s.exerciseId, list)
  }
  const exerciseIds = Array.from(setsByExercise.keys())

  return (
    <div>
      <AppHeader title="Sesión" subtitle={dateLabel} />
      <div className="space-y-4 p-4">
        <Link
          to="/perfil"
          className="inline-flex min-h-[40px] items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent-soft"
        >
          <ArrowLeft className="size-4" aria-hidden /> Historial
        </Link>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-3">
            <Clock className="mb-2 size-5 text-muted" />
            <p className="text-[0.7rem] uppercase tracking-wider text-muted">Duración</p>
            <p className="font-display text-lg font-bold text-fg">
              {durationMin !== null ? `${durationMin} min` : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-3">
            <Flame className="mb-2 size-5 text-cta" />
            <p className="text-[0.7rem] uppercase tracking-wider text-muted">Volumen</p>
            <p className="font-display text-lg font-bold text-fg">
              {Math.round(applyUnits(workout.totalVolume, settings.units)).toLocaleString()} {formatUnits(settings.units)}
            </p>
          </div>
          <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-3">
            <Dumbbell className="mb-2 size-5 text-accent" />
            <p className="text-[0.7rem] uppercase tracking-wider text-muted">Series</p>
            <p className="font-display text-lg font-bold text-fg">
              {completedSets}/{sets.length}
            </p>
          </div>
        </div>

        {workout.notes && (
          <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
            <p className="text-sm leading-relaxed text-fg">{workout.notes}</p>
          </div>
        )}

        {exerciseIds.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gold/40 bg-bg-elevated/50 p-8 text-center">
            <p className="text-sm text-muted">Esta sesión no tiene ejercicios registrados.</p>
          </div>
        ) : (
          exerciseIds.map((exerciseId) => {
            const name = nameById.get(exerciseId) ?? `Ejercicio #${exerciseId}`
            const exerciseSets = setsByExercise.get(exerciseId) ?? []
            return (
              <div key={exerciseId} className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
                <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
                  {name}
                </h2>
                <div className="space-y-1.5">
                  {exerciseSets.map((set) => (
                    <div
                      key={set.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex w-8 shrink-0 items-center gap-1 text-xs text-muted">
                        {set.isWarmup ? (
                          <span className="rounded-full border border-cta/40 bg-cta/10 px-2 py-0.5 text-[0.65rem] font-semibold text-accent-soft">
                            CAL
                          </span>
                        ) : (
                          `#${set.setNumber}`
                        )}
                      </span>
                      <span className="min-w-0 flex-1 text-right font-semibold text-fg">
                        {formatWeight(set.weightKg, settings.units)} × {set.reps}
                      </span>
                      {set.rpe !== undefined && (
                        <span className="w-10 shrink-0 text-right text-xs text-muted">
                          RPE {set.rpe}
                        </span>
                      )}
                      {set.rir !== undefined && (
                        <span className="w-10 shrink-0 text-right text-xs text-muted">
                          RIR {set.rir}
                        </span>
                      )}
                      {set.completed ? (
                        <span className="w-5 shrink-0 text-xs text-success" aria-label="Completada">
                          ✓
                        </span>
                      ) : (
                        <span className="w-5 shrink-0 text-xs text-muted" aria-label="Sin completar">
                          –
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
