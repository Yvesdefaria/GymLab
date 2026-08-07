import { useMemo } from 'react'
import { Flame, Trophy, TrendingUp, Calendar, User, AlertTriangle, Dumbbell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { useStreak } from '@/hooks/useStreak'
import { useWorkouts } from '@/hooks/useWorkouts'
import { usePRs } from '@/hooks/usePRs'
import { VolumeChart } from '@/components/profile/VolumeChart'
import { formatVolume } from '@/domain/volume'
import { detectDeloadSignal } from '@/domain/progress'
import { deloadUntilDate } from '@/domain/deload'
import { activeProgramRepo } from '@/data/repositories'
import { useSettings } from '@/hooks/useSettings'
import { formatWeight, formatUnits } from '@/domain/settings'
import { computeWeeklyVolumeInsight } from '@/domain/insights'
import { InsightCard } from '@/components/insights/InsightCard'
import { BackLink } from '@/components/ui/BackLink'
import { WorkoutHistoryTimeline } from '@/components/workout/WorkoutHistoryTimeline'
import { weeklyVolume } from '@/domain/workouts'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'

export const PerfilPage = () => {
  const { settings } = useSettings()
  const streak = useStreak()
  const { workouts } = useWorkouts()
  const { prs } = usePRs()

  const { exercises } = useExerciseCatalog()
  const nameById = useMemo(() => new Map(exercises.map((e) => [e.id, e.name])), [exercises])
  const { program } = useActiveProgram()

  const handleActivateDeload = async () => {
    await activeProgramRepo.setDeload(true, deloadUntilDate())
  }

  const weeklyVolumeValue = useMemo(() => weeklyVolume(workouts), [workouts])

  const totalVolume = useMemo(() => workouts.reduce((acc, w) => acc + w.totalVolume, 0), [workouts])

  const deload = useMemo(() => detectDeloadSignal(workouts), [workouts])

  const volumeInsight = useMemo(() => computeWeeklyVolumeInsight(workouts), [workouts])

  return (
    <div>
      <AppHeader title="Perfil" subtitle="Tu progreso y estadísticas" />
      <div className="space-y-4 p-4">
        <BackLink to="/mas" />
        {/* User card */}
        <div className="flex items-center gap-3 panel rounded-2xl p-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-bg text-accent">
            <User className="size-7" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-fg">Atleta</p>
            <p className="text-xs text-muted">{workouts.length} entrenos registrados</p>
          </div>
        </div>

        {/* Deload suggestion */}
        {deload?.suggestsDeload && (
          <div className="flex items-start gap-3 rounded-2xl border border-gold/50 bg-cta/10 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-cta" aria-hidden />
            <div>
              <p className="font-display text-sm font-semibold text-accent-soft">
                Semana de deload recomendada
              </p>
              <p className="mt-1 text-xs text-muted">
                Tu volumen medio de las últimas 3 semanas ha caído un {Math.round(deload.dropPct)}%
                respecto a las 3 anteriores. Una semana ligera puede ayudarte a recuperar y seguir
                progresando.
              </p>
              {program && (
                <button
                  type="button"
                  onClick={() => void handleActivateDeload()}
                  className="mt-3 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-cta px-4 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90"
                >
                  <AlertTriangle className="size-4" aria-hidden />
                  Activar semana de deload
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats grid */}
        {workouts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gold/40 bg-bg-elevated/50 p-6 text-center">
            <Flame className="mx-auto mb-3 size-8 text-cta" aria-hidden />
            <p className="font-display text-base font-semibold text-fg">Todavía no hay datos</p>
            <p className="mt-1 text-sm text-muted">
              Registra tu primer entreno para ver tu racha, tu volumen semanal y tus mejores marcas.
            </p>
            <Link
              to="/"
              className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-cta px-5 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90"
            >
              <Dumbbell className="size-4" aria-hidden />
              Empezar a entrenar
            </Link>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="panel rounded-2xl p-4">
            <Flame className="mb-2 size-5 text-cta" />
            <p className="kicker">Racha actual</p>
            <p className="stat-value text-2xl">
              {streak.currentStreak > 0 ? `${streak.currentStreak} días` : '—'}
            </p>
          </div>
          <div className="panel rounded-2xl p-4">
            <TrendingUp className="mb-2 size-5 text-success" />
            <p className="kicker">Volumen semanal</p>
            <p className="stat-value text-2xl">
              {weeklyVolumeValue > 0 ? formatVolume(weeklyVolumeValue) : '—'}
            </p>
          </div>
          <div className="panel rounded-2xl p-4">
            <Calendar className="mb-2 size-5 text-accent" />
            <p className="kicker">Total entreno</p>
            <p className="stat-value text-2xl">
              {totalVolume > 0 ? formatVolume(totalVolume) : '—'}
            </p>
          </div>
          <div className="panel rounded-2xl p-4">
            <Trophy className="mb-2 size-5 text-cta" />
            <p className="kicker">PRs</p>
            <p className="stat-value text-2xl">
              {prs.length > 0 ? prs.length : '—'}
            </p>
          </div>
        </div>

        {/* Volume chart */}
        {workouts.length >= 1 && (
          <div className="panel rounded-2xl p-4">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
              Volumen por semana
            </h2>
            <VolumeChart workouts={workouts} />
          </div>
        )}

        {volumeInsight && (
          <InsightCard insight={volumeInsight} units={formatUnits(settings.units)} />
        )}

        {/* PRs list */}
        <div className="panel rounded-2xl p-4">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
            Mejores marcas
          </h2>
          {prs.length > 0 ? (
            <div className="space-y-2">
              {prs.slice(0, 10).map((pr) => (
                <div
                  key={pr.exerciseId}
                  className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 last:border-0 last:pb-0"
                >
                  <span className="min-w-0 truncate text-sm text-fg">
                    {nameById.get(pr.exerciseId) ?? `Ejercicio #${pr.exerciseId}`}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {formatWeight(pr.weightKg, settings.units)} × {pr.reps} ({formatWeight(pr.estimated1RM, settings.units)} e1RM)
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">
              Completa series con peso para registrar tus mejores marcas.
            </p>
          )}
        </div>

        {/* Recent workouts */}
        {workouts.length > 0 && (
          <div className="panel rounded-2xl p-4">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
              Historial reciente
            </h2>
            <WorkoutHistoryTimeline workouts={workouts} units={settings.units} />
          </div>
        )}
      </div>
    </div>
  )
}
