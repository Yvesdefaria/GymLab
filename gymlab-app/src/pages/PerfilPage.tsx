import { Flame, Trophy, TrendingUp, Calendar, User } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { useStreak } from '@/hooks/useStreak'
import { useWorkouts } from '@/hooks/useWorkouts'
import { usePRs } from '@/hooks/usePRs'
import { VolumeChart } from '@/components/profile/VolumeChart'
import { formatVolume } from '@/domain/volume'

export const PerfilPage = () => {
  const streak = useStreak()
  const { workouts } = useWorkouts()
  const { prs } = usePRs()

  const weeklyVolume = workouts
    .filter((w) => {
      const d = new Date(w.startedAt)
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 86400000)
      return d >= weekAgo
    })
    .reduce((acc, w) => acc + w.totalVolume, 0)

  const totalVolume = workouts.reduce((acc, w) => acc + w.totalVolume, 0)

  return (
    <div>
      <AppHeader title="Perfil" subtitle="Tu progreso y estadísticas" />
      <div className="space-y-4 p-4">
        {/* User card */}
        <div className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-bg-elevated p-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-bg text-accent">
            <User className="size-7" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-fg">Atleta</p>
            <p className="text-xs text-muted">{workouts.length} entrenos registrados</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
            <Flame className="mb-2 size-5 text-cta" />
            <p className="text-xs uppercase tracking-wider text-muted">Racha actual</p>
            <p className="font-display text-2xl font-bold text-accent">
              {streak.currentStreak > 0 ? `${streak.currentStreak} días` : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
            <TrendingUp className="mb-2 size-5 text-success" />
            <p className="text-xs uppercase tracking-wider text-muted">Volumen semanal</p>
            <p className="font-display text-2xl font-bold text-accent">
              {weeklyVolume > 0 ? formatVolume(weeklyVolume) : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
            <Calendar className="mb-2 size-5 text-accent" />
            <p className="text-xs uppercase tracking-wider text-muted">Total entreno</p>
            <p className="font-display text-2xl font-bold text-accent">
              {totalVolume > 0 ? formatVolume(totalVolume) : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
            <Trophy className="mb-2 size-5 text-cta" />
            <p className="text-xs uppercase tracking-wider text-muted">PRs</p>
            <p className="font-display text-2xl font-bold text-accent">
              {prs.length > 0 ? prs.length : '—'}
            </p>
          </div>
        </div>

        {/* Volume chart */}
        {workouts.length >= 2 && (
          <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
              Volumen por semana
            </h2>
            <VolumeChart workouts={workouts} />
          </div>
        )}

        {/* PRs list */}
        {prs.length > 0 && (
          <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
              Mejores marcas
            </h2>
            <div className="space-y-2">
              {prs.slice(0, 10).map((pr) => (
                <div
                  key={pr.exerciseId}
                  className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-sm text-fg">Ejercicio #{pr.exerciseId}</span>
                  <span className="text-xs text-muted">
                    {pr.weightKg}kg × {pr.reps} ({pr.estimated1RM}kg e1RM)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent workouts */}
        {workouts.length > 0 && (
          <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
              Historial reciente
            </h2>
            <div className="space-y-2">
              {workouts.slice(0, 10).map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0"
                >
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
          </div>
        )}
      </div>
    </div>
  )
}
