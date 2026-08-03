import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Play, Flame, TrendingUp, Dumbbell, CalendarDays, Activity } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { MonthCalendar } from '@/components/calendar/MonthCalendar'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useStreak } from '@/hooks/useStreak'
import { useWorkouts } from '@/hooks/useWorkouts'
import { formatVolume } from '@/domain/volume'
import { useLiveQuery } from 'dexie-react-hooks'
import { activeProgramRepo, routineRepo } from '@/data/repositories'
import { programProgressPct, trainedLocalDates } from '@/domain/calendar'
import { sessionProgressPct } from '@/domain/sessionProgress'
import { toLocalDateStr } from '@/domain/dates'

export const EntrenarPage = () => {
  const navigate = useNavigate()
  const { startedAt, exercises, startWorkout } = useActiveWorkoutStore()
  const streak = useStreak()
  const { workouts } = useWorkouts()

  const program = useLiveQuery(() => activeProgramRepo.get(), [])
  const routine = useLiveQuery(
    () =>
      program
        ? routineRepo.getAll().then((rs) => rs.find((r) => r.id === program.routineId))
        : undefined,
    [program]
  )

  const weeklyVolume = workouts
    .filter((w) => {
      const d = w.localDate ? new Date(w.localDate + 'T12:00:00') : new Date(w.startedAt)
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 86400000)
      return d >= weekAgo
    })
    .reduce((acc, w) => acc + w.totalVolume, 0)

  const lastWorkout = workouts[0]
  const hasActiveWorkout = startedAt !== null

  const trainedDates = useMemo(() => trainedLocalDates(workouts), [workouts])
  const programPct = useMemo(
    () => programProgressPct([...trainedDates], program ?? null, routine?.daysCount ?? 0),
    [trainedDates, program, routine]
  )

  const sessionCompleted = exercises.reduce(
    (a, e) => a + e.sets.filter((s) => s.completed).length,
    0
  )
  const sessionTotal = exercises.reduce((a, e) => a + e.sets.length, 0)
  const sessionPct = sessionProgressPct(sessionCompleted, sessionTotal)

  const handleStart = () => {
    startWorkout()
    navigate('/entrenamiento/active')
  }

  return (
    <div>
      <AppHeader title="Entrenar" subtitle="Registra series, reps y peso" />
      <div className="space-y-4 p-4 pb-32">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
            <Flame className="mb-2 size-5 text-cta" aria-hidden />
            <p className="text-xs uppercase tracking-wider text-muted">Racha</p>
            <p className="font-display text-2xl font-bold text-accent">
              {streak.currentStreak > 0 ? `${streak.currentStreak}d` : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
            <TrendingUp className="mb-2 size-5 text-success" aria-hidden />
            <p className="text-xs uppercase tracking-wider text-muted">Volumen sem.</p>
            <p className="font-display text-2xl font-bold text-accent">
              {weeklyVolume > 0 ? formatVolume(weeklyVolume) : '—'}
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-lg text-accent">Calendario</h2>
            <Link
              to="/calendario"
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-border px-2 text-xs text-accent-soft"
            >
              <CalendarDays className="size-3.5" /> Ver completo
            </Link>
          </div>
          <MonthCalendar trained={trainedDates} program={program ?? null} routineDaysCount={routine?.daysCount ?? 0} compact />
        </section>

        <section className="flex items-center gap-4 rounded-2xl border border-gold/40 bg-bg-elevated p-4">
          <ProgressRing
            value={hasActiveWorkout ? sessionPct : programPct}
            label={hasActiveWorkout ? 'Progreso sesión' : 'Progreso programa'}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted">
              {hasActiveWorkout ? 'Sesión en curso' : 'Programa activo'}
            </p>
            <p className="font-display text-base font-semibold text-fg">
              {hasActiveWorkout
                ? `${sessionCompleted}/${sessionTotal || '—'} series`
                : routine
                  ? routine.title
                  : 'Elige una rutina y síguela'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                to="/calendario"
                className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-border px-2 text-xs text-accent-soft"
              >
                <CalendarDays className="size-3.5" /> Calendario
              </Link>
              <Link
                to="/cuerpo"
                className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-border px-2 text-xs text-accent-soft"
              >
                <Activity className="size-3.5" /> Cuerpo
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
          <h2 className="font-display text-lg text-accent">Último entreno</h2>
          {lastWorkout ? (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-fg">
                {new Date(
                  (lastWorkout.localDate || toLocalDateStr(new Date(lastWorkout.startedAt))) +
                    'T12:00:00'
                ).toLocaleDateString('es-ES', {
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

        {workouts.length > 1 && (
          <section className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
            <h2 className="font-display text-lg text-accent">Historial reciente</h2>
            <div className="mt-2 space-y-2">
              {workouts.slice(1, 6).map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-sm text-fg">
                    {new Date(
                      (w.localDate || toLocalDateStr(new Date(w.startedAt))) + 'T12:00:00'
                    ).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <span className="text-xs text-muted">{w.totalVolume.toLocaleString()} kg</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4 pb-3">
        <div className="mx-auto max-w-lg md:max-w-3xl lg:max-w-5xl">
          {hasActiveWorkout ? (
            <Link
              to="/entrenamiento/active"
              className="gold-gradient flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-display text-lg font-semibold tracking-wide text-on-gold shadow-lg transition-opacity hover:opacity-90"
            >
              <Dumbbell className="size-5" />
              Continuar entreno ({exercises.length} ejercicios)
            </Link>
          ) : (
            <button
              onClick={handleStart}
              className="gold-gradient flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-display text-lg font-semibold tracking-wide text-on-gold shadow-lg transition-opacity hover:opacity-90"
            >
              <Play className="size-5" fill="currentColor" />
              Iniciar entrenamiento
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
