import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Play, Flame, TrendingUp, Dumbbell, CalendarDays, Activity } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { MonthCalendar } from '@/components/calendar/MonthCalendar'
import { InstallBanner } from '@/components/ui/InstallBanner'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useStreak } from '@/hooks/useStreak'
import { useWorkouts } from '@/hooks/useWorkouts'
import { formatVolume } from '@/domain/volume'
import { useLiveQuery } from 'dexie-react-hooks'
import { activeProgramRepo, routineRepo } from '@/data/repositories'
import { programProgressPct, trainedLocalDates, scheduledDayIndex } from '@/domain/calendar'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatUnits } from '@/domain/settings'
import { useBodyWeight } from '@/hooks/useBodyWeight'
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

  const routineDays = useLiveQuery(
    () => (routine ? routineRepo.getDays(routine.id) : []),
    [routine]
  ) ?? []

  const { settings } = useSettings()
  const { entries } = useBodyWeight()

  const trainedDates = useMemo(() => trainedLocalDates(workouts), [workouts])

  const todayIndex = program ? scheduledDayIndex(program, toLocalDateStr()) : null
  const todayDay =
    todayIndex !== null && routineDays.length > 0
      ? routineDays[todayIndex % routineDays.length]
      : null
  const todayDone = todayDay ? trainedDates.has(toLocalDateStr()) : false

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
        {settings.showInstallPrompt && <InstallBanner />}

        {settings.showWeightHint && entries.length > 0 && (
          <Link
            to="/peso-corporal"
            className="flex min-h-[40px] items-center justify-between rounded-xl border border-border/60 bg-bg-elevated/60 px-3 text-xs text-muted transition-colors hover:border-cta"
          >
            <span>Último peso registrado</span>
            <span className="font-display font-semibold text-accent">
              {applyUnits(entries[entries.length - 1].weightKg, settings.units).toFixed(1)}{' '}
              {formatUnits(settings.units)}
            </span>
          </Link>
        )}

        {settings.homeShowTodayFocus && todayDay && !hasActiveWorkout && (
          <button
            onClick={handleStart}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-cta/50 bg-cta/15 p-4 text-left"
          >
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-cta">
                {todayDone ? 'Hoy entrenado' : 'Hoy toca'}
              </p>
              <p className="truncate font-display text-base font-semibold text-fg">
                {todayDay.name}
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-cta px-3 py-1.5 text-xs font-semibold text-on-gold">
              {todayDone ? 'Completado' : 'Empezar'}
            </span>
          </button>
        )}

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
            <Link to={`/entrenamiento/${lastWorkout.id}`} className="mt-2 block space-y-1">
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
                Volumen: {Math.round(applyUnits(lastWorkout.totalVolume, settings.units)).toLocaleString()} {formatUnits(settings.units)}
              </p>
            </Link>
          ) : (
            <p className="mt-1 text-sm text-muted">Aún no hay sesiones.</p>
          )}
        </section>

        {workouts.length > 1 && (
          <section className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
            <h2 className="font-display text-lg text-accent">Historial reciente</h2>
            <div className="mt-2 space-y-2">
              {workouts.slice(1, 6).map((w) => (
                <Link
                  key={w.id}
                  to={`/entrenamiento/${w.id}`}
                  className="flex items-center justify-between rounded-lg border-b border-border/50 pb-2 transition-colors last:border-0 last:pb-0 hover:bg-bg/60"
                >
                  <span className="text-sm text-fg">
                    {new Date(
                      (w.localDate || toLocalDateStr(new Date(w.startedAt))) + 'T12:00:00'
                    ).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <span className="text-xs text-muted">{Math.round(applyUnits(w.totalVolume, settings.units)).toLocaleString()} {formatUnits(settings.units)}</span>
                </Link>
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
