import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Play, Flame, TrendingUp, Dumbbell, CalendarDays, Activity } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { WeekCalendar } from '@/components/calendar/WeekCalendar'
import { InstallBanner } from '@/components/ui/InstallBanner'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useStreak } from '@/hooks/useStreak'
import { useWorkouts } from '@/hooks/useWorkouts'
import { CountUp } from '@/components/ui/CountUp'
import { activeProgramRepo } from '@/data/repositories'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { useRoutineDays, useRoutineDayMuscleGroups, useRoutineDayItems } from '@/hooks/useRoutines'
import { useStartSession } from '@/hooks/useStartSession'
import { programProgressPct, trainedLocalDates, scheduledDayIndex } from '@/domain/calendar'
import { deloadUntilDate, isDeloadActive } from '@/domain/deload'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatUnits } from '@/domain/settings'
import { useBodyWeight } from '@/hooks/useBodyWeight'
import { sessionProgressPct } from '@/domain/sessionProgress'
import { toLocalDateStr } from '@/domain/dates'
import { computeWeeklyVolumeInsight } from '@/domain/insights'
import { InsightCard } from '@/components/insights/InsightCard'
import { WorkoutHistoryTimeline } from '@/components/workout/WorkoutHistoryTimeline'
import { weeklyVolume, workoutDurationMin } from '@/domain/workouts'

export const EntrenarPage = () => {
  const navigate = useNavigate()
  const startedAt = useActiveWorkoutStore((s) => s.startedAt)
  const exercises = useActiveWorkoutStore((s) => s.exercises)
  const { startRoutineDay } = useStartSession()
  const startWorkout = useActiveWorkoutStore((s) => s.startWorkout)
  const streak = useStreak()
  const { workouts } = useWorkouts()
  const { program, routine } = useActiveProgram()
  const { days: routineDays } = useRoutineDays(routine?.id ?? null)

  const { settings } = useSettings()
  const { entries } = useBodyWeight()

  const trainedDates = useMemo(() => trainedLocalDates(workouts), [workouts])

  const todayIndex = program ? scheduledDayIndex(program, toLocalDateStr()) : null
  const todayDay =
    todayIndex !== null && routineDays.length > 0
      ? routineDays[todayIndex % routineDays.length]
      : null
  const todayDone = todayDay ? trainedDates.has(toLocalDateStr()) : false

  const { groups: todayGroups } = useRoutineDayMuscleGroups(todayDay?.id ?? null)
  const { items: todayItems } = useRoutineDayItems(todayDay?.id ?? null)

  const weeklyVolumeValue = weeklyVolume(workouts)

  const volValue = weeklyVolumeValue >= 1000 ? weeklyVolumeValue / 1000 : weeklyVolumeValue
  const volDecimals = weeklyVolumeValue >= 1000 ? 1 : 0
  const volSuffix = weeklyVolumeValue >= 1000 ? 'k' : ''

  const lastWorkout = workouts[0]
  const hasActiveWorkout = startedAt !== null
  const deloadActive = program ? isDeloadActive(program.deloadActive, program.deloadUntil) : false
  const [deloadBusy, setDeloadBusy] = useState(false)

  const handleToggleDeload = async () => {
    if (!program) return
    setDeloadBusy(true)
    await activeProgramRepo.setDeload(!deloadActive, !deloadActive ? deloadUntilDate() : null)
    setDeloadBusy(false)
  }

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

  const volumeInsight = useMemo(() => computeWeeklyVolumeInsight(workouts), [workouts])

  const handleStart = async () => {
    if (todayDay && todayItems.length > 0 && routine) {
      await startRoutineDay(
        todayItems.map((it) => ({
          exerciseId: it.exerciseId,
          exerciseName: it.exerciseName ?? `Ejercicio ${it.exerciseId}`,
          restSec: it.restSec,
          supersetGroup: it.supersetGroup,
          targetSets: it.targetSets,
          targetReps: it.targetReps,
        })),
        routine.id,
        todayDay.id
      )
    } else {
      startWorkout()
    }
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
            className="flex min-h-[44px] items-center justify-between rounded-xl border border-border/60 bg-bg-elevated/60 px-3 text-xs text-muted transition-colors hover:border-cta"
          >
            <span>Último peso registrado</span>
            <span className="font-display font-semibold text-accent">
              {applyUnits(entries[entries.length - 1].weightKg, settings.units).toFixed(1)}{' '}
              {formatUnits(settings.units)}
            </span>
          </Link>
        )}

        <section className="panel-hero reveal overflow-hidden rounded-3xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="kicker">
                {hasActiveWorkout
                  ? 'Sesión en curso'
                  : todayDone
                    ? 'Hoy entrenado'
                    : todayDay
                      ? 'Hoy toca'
                      : program
                        ? 'Sin sesión programada'
                        : 'Entrenar'}
              </p>
              <h2 className="mt-1.5 font-display text-[2.6rem] font-bold leading-[0.95] tracking-tight text-fg">
                {hasActiveWorkout
                  ? "Let's Go"
                  : todayDay
                    ? todayDay.name
                    : program
                      ? 'Día de descanso'
                      : 'Sin plan hoy'}
              </h2>
              {todayGroups.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {todayGroups.map((g) => (
                    <span key={g} className="chip">
                      {g}
                    </span>
                  ))}
                </div>
              )}
              {!program && !hasActiveWorkout && (
                <p className="mt-2 text-sm text-muted">
                  Elige una rutina y sigue tu plan día a día.
                </p>
              )}
            </div>
            <div className="shrink-0">
              <ProgressRing
                value={hasActiveWorkout ? sessionPct : programPct}
                label={hasActiveWorkout ? 'Progreso sesión' : 'Progreso programa'}
              />
            </div>
          </div>

          <div className="mt-5">
            {hasActiveWorkout ? (
              <button
                onClick={() => navigate('/entrenamiento/active')}
                className="gold-gradient flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl font-display text-base font-semibold text-on-gold shadow-lg shadow-cta/20 transition-transform active:scale-[0.98]"
              >
                <Dumbbell className="size-5" />
                Continuar entreno
              </button>
            ) : todayDay ? (
              <button
                onClick={handleStart}
                className="gold-gradient flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl font-display text-base font-semibold text-on-gold shadow-lg shadow-cta/20 transition-transform active:scale-[0.98]"
              >
                <Play className="size-5" fill="currentColor" />
                {todayDone ? 'Entrenar otra vez' : 'Empezar hoy'}
              </button>
            ) : program ? (
              <button
                onClick={handleStart}
                className="gold-gradient flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl font-display text-base font-semibold text-on-gold shadow-lg shadow-cta/20 transition-transform active:scale-[0.98]"
              >
                <Play className="size-5" fill="currentColor" />
                Iniciar entrenamiento
              </button>
            ) : (
              <Link
                to="/rutinas"
                className="gold-gradient flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl font-display text-base font-semibold text-on-gold shadow-lg shadow-cta/20 transition-transform active:scale-[0.98]"
              >
                Ver rutinas
              </Link>
            )}
          </div>
        </section>

        <div className="reveal reveal-1 grid grid-cols-2 gap-3">
          <div className="panel rounded-2xl p-4">
            <Flame className="mb-2 size-5 text-cta" aria-hidden />
            <p className="kicker">Racha</p>
            <p className="stat-value mt-1 text-3xl">
              {streak.currentStreak > 0 ? (
                <>
                  <CountUp value={streak.currentStreak} />
                  d
                </>
              ) : (
                '—'
              )}
            </p>
          </div>
          <div className="panel rounded-2xl p-4">
            <TrendingUp className="mb-2 size-5 text-success" aria-hidden />
            <p className="kicker">Volumen sem.</p>
            <p className="stat-value mt-1 text-3xl">
              {weeklyVolumeValue > 0 ? (
                <>
                  <CountUp value={volValue} decimals={volDecimals} />
                  {volSuffix}
                </>
              ) : (
                '—'
              )}
            </p>
          </div>
        </div>

        {volumeInsight && (
          <InsightCard insight={volumeInsight} units={formatUnits(settings.units)} />
        )}

        <section className="panel rounded-2xl p-4">
          <WeekCalendar trained={trainedDates} program={program ?? null} routineDaysCount={routine?.daysCount ?? 0} />
        </section>

        <section className="panel flex items-center gap-4 rounded-2xl p-4">
          <ProgressRing
            value={hasActiveWorkout ? sessionPct : programPct}
            label={hasActiveWorkout ? 'Progreso sesión' : 'Progreso programa'}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="kicker">
                {hasActiveWorkout ? 'Sesión en curso' : 'Programa activo'}
              </p>
              {deloadActive && !hasActiveWorkout && (
                <span className="chip">
                  Semana deload
                </span>
              )}
            </div>
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
                className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-border px-2 text-xs text-accent-soft"
              >
                <CalendarDays className="size-3.5" /> Calendario
              </Link>
              <Link
                to="/cuerpo"
                className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-border px-2 text-xs text-accent-soft"
              >
                <Activity className="size-3.5" /> Cuerpo
              </Link>
            </div>
          </div>
        </section>

        {program && !hasActiveWorkout && (
          <section className="panel flex items-center justify-between gap-3 rounded-2xl p-4">
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-fg">Semana de deload</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                Reduce volumen e intensidad esta semana para recuperarte y seguir progresando.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={deloadActive}
              aria-label="Activar semana de deload"
              onClick={() => void handleToggleDeload()}
              disabled={deloadBusy}
              className={`relative inline-flex h-11 w-14 shrink-0 items-center rounded-full border transition-colors disabled:opacity-60 ${
                deloadActive ? 'border-cta bg-cta/30' : 'border-border bg-bg'
              }`}
            >
              <span
                className={`inline-block size-6 rounded-full bg-cta shadow transition-transform ${
                  deloadActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </section>
        )}

        <section className="panel rounded-2xl p-4">
          <h2 className="font-display text-lg text-accent">Último entreno</h2>
          {lastWorkout ? (
            <Link
              to={`/entrenamiento/${lastWorkout.id}`}
              className="mt-2 flex items-start gap-3 rounded-xl border border-cta/40 bg-bg/40 px-3 py-2 transition-colors hover:bg-bg/60"
            >
              <span
                className="mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-cta bg-bg-elevated"
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-fg">
                    {new Date(
                      (lastWorkout.localDate || toLocalDateStr(new Date(lastWorkout.startedAt))) +
                        'T12:00:00'
                    ).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(lastWorkout.startedAt).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {Math.round(applyUnits(lastWorkout.totalVolume, settings.units)).toLocaleString()}{' '}
                  {formatUnits(settings.units)}
                  {lastWorkout.finishedAt
                    ? ` · ${workoutDurationMin(lastWorkout)} min`
                    : ''}
                </span>
              </span>
            </Link>
          ) : (
            <p className="mt-1 text-sm text-muted">Aún no hay sesiones.</p>
          )}
        </section>

        {workouts.length > 1 && (
          <section className="panel rounded-2xl p-4">
            <h2 className="mb-3 font-display text-lg text-accent">Historial reciente</h2>
            <WorkoutHistoryTimeline workouts={workouts} units={settings.units} startFrom={1} max={5} />
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
