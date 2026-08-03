import { Link } from 'react-router-dom'
import { Play, Flame, TrendingUp, Dumbbell } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useStreak } from '@/hooks/useStreak'
import { useWorkouts } from '@/hooks/useWorkouts'
import { formatVolume } from '@/domain/volume'

export const EntrenarPage = () => {
  const { exercises, startWorkout } = useActiveWorkoutStore()
  const streak = useStreak()
  const { workouts } = useWorkouts()

  const weeklyVolume = workouts
    .filter((w) => {
      const d = new Date(w.startedAt)
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 86400000)
      return d >= weekAgo
    })
    .reduce((acc, w) => acc + w.totalVolume, 0)

  const lastWorkout = workouts[0]

  const hasActiveWorkout = exercises.length > 0

  return (
    <div>
      <AppHeader title="Entrenar" subtitle="Registra series, reps y peso" />
      <div className="space-y-4 p-4">
        {/* CTA */}
        {hasActiveWorkout ? (
          <Link
            to="/entrenamiento/active"
            className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-success px-4 py-3 font-display text-lg font-semibold tracking-wide text-bg transition-opacity hover:opacity-90"
          >
            <Dumbbell className="size-5" />
            Continuar entreno ({exercises.length} ejercicios)
          </Link>
        ) : (
          <button
            onClick={() => {
              startWorkout()
            }}
            className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-cta px-4 py-3 font-display text-lg font-semibold tracking-wide text-bg transition-opacity hover:opacity-90"
          >
            <Play className="size-5" fill="currentColor" />
            Iniciar entrenamiento
          </button>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-bg-elevated p-4">
            <Flame className="mb-2 size-5 text-cta" aria-hidden />
            <p className="text-xs uppercase tracking-wider text-muted">Racha</p>
            <p className="font-display text-2xl font-bold text-accent">
              {streak.currentStreak > 0 ? `${streak.currentStreak}d` : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-bg-elevated p-4">
            <TrendingUp className="mb-2 size-5 text-success" aria-hidden />
            <p className="text-xs uppercase tracking-wider text-muted">Volumen sem.</p>
            <p className="font-display text-2xl font-bold text-accent">
              {weeklyVolume > 0 ? formatVolume(weeklyVolume) : '—'}
            </p>
          </div>
        </div>

        {/* Last workout */}
        <section className="rounded-2xl border border-border bg-bg-elevated p-4">
          <h2 className="font-display text-lg text-accent">Último entreno</h2>
          {lastWorkout ? (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-fg">
                {new Date(lastWorkout.startedAt).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
              <p className="text-xs text-muted">
                Volumen: {lastWorkout.totalVolume.toLocaleString()} kg
              </p>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted">Aún no hay sesiones.</p>
          )}
        </section>

        {/* Recent workouts */}
        {workouts.length > 1 && (
          <section className="rounded-2xl border border-border bg-bg-elevated p-4">
            <h2 className="font-display text-lg text-accent">Historial reciente</h2>
            <div className="mt-2 space-y-2">
              {workouts.slice(1, 6).map((w) => (
                <div key={w.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                  <span className="text-sm text-fg">
                    {new Date(w.startedAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <span className="text-xs text-muted">
                    {w.totalVolume.toLocaleString()} kg
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
