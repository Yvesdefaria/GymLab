// Página home «Entrenar» (/): inicio de sesión, progreso del programa, racha e historial.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Play, Flame, TrendingUp, Dumbbell, CalendarDays, Activity } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
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
import { localDateOf, toLocalDateStr } from '@/domain/dates'
import { computeWeeklyVolumeInsight } from '@/domain/insights'
import { InsightCard } from '@/components/insights/InsightCard'
import { InfoTip } from '@/components/ui/InfoTip'
import { WorkoutHistoryTimeline } from '@/components/workout/WorkoutHistoryTimeline'
import { weeklyVolume, workoutDurationMin } from '@/domain/workouts'
import { formatVolume } from '@/domain/volume'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'

// Home de entrenamiento: decide qué toca hoy según programa activo y el estado de la sesión.
export const EntrenarPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
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

  // Día programado de hoy (rotatorio según el programa) y si ya se ha entrenado hoy.
  const todayIndex = program ? scheduledDayIndex(program, toLocalDateStr()) : null
  const todayDay =
    todayIndex !== null && routineDays.length > 0
      ? routineDays[todayIndex % routineDays.length]
      : null
  const todayDone = todayDay ? trainedDates.has(toLocalDateStr()) : false

  const { groups: todayGroups } = useRoutineDayMuscleGroups(todayDay?.id ?? null)
  const { items: todayItems } = useRoutineDayItems(todayDay?.id ?? null)

  const weeklyVolumeValue = weeklyVolume(workouts)

  const lastWorkout = workouts[0]
  const hasActiveWorkout = startedAt !== null
  const deloadActive = program ? isDeloadActive(program.deloadActive, program.deloadUntil) : false
  const [deloadBusy, setDeloadBusy] = useState(false)

  // Atmósfera del hero: foto de la rutina activa; custom sin foto usa la predeterminada;
  // sin rutina activa se conserva la imagen genérica de gimnasio.
  const heroImage =
    routine?.imageUrl ?? (routine ? '/images/routines/default.jpg' : '/images/home-hero.jpg')

  // Activa/desactiva la semana de deload y guarda su fecha límite en el programa activo.
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

  // Progreso de la sesión en curso (series hechas sobre total) para el anillo de progreso.
  const sessionCompleted = exercises.reduce(
    (a, e) => a + e.sets.filter((s) => s.completed).length,
    0
  )
  const sessionTotal = exercises.reduce((a, e) => a + e.sets.length, 0)
  const sessionPct = sessionProgressPct(sessionCompleted, sessionTotal)

  const volumeInsight = useMemo(() => computeWeeklyVolumeInsight(workouts), [workouts])

  // Inicia la sesión: precarga el día de la rutina si hay uno programado; si no, sesión en blanco.
  const handleStart = async () => {
    if (todayDay && todayItems.length > 0 && routine) {
      await startRoutineDay(
        todayItems.map((it) => ({
          exerciseId: it.exerciseId,
          exerciseName: it.exerciseName ?? t('home.ejercicioFallback', { id: it.exerciseId }),
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
      <AppHeader title={t('home.titulo')} subtitle={t('home.subtitulo')} />
      <div className="space-y-4 p-4 pb-32">
        {settings.showInstallPrompt && <InstallBanner />}

        {settings.showWeightHint && entries.length > 0 && (
          <Link
            to="/peso-corporal"
            className="flex min-h-[44px] items-center justify-between rounded-xl border border-border/60 bg-bg-elevated/60 px-3 text-xs text-muted transition-colors hover:border-cta"
          >
            <span>{t('home.ultimoPeso')}</span>
            <span className="font-display font-semibold text-accent">
              {applyUnits(entries[entries.length - 1].weightKg, settings.units).toFixed(1)}{' '}
              {formatUnits(settings.units)}
            </span>
          </Link>
        )}

        <section className="panel-hero reveal overflow-hidden rounded-3xl p-5">
          {/* Atmósfera fotográfica del hero: foto de la rutina activa con velo y tinte dorado. */}
          <div className="hero-atmosphere" aria-hidden="true">
            <img src={heroImage} alt="" loading="eager" decoding="async" />
          </div>
          <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="kicker">
                {hasActiveWorkout
                  ? t('home.sesionEnCurso')
                  : todayDone
                    ? t('home.hoyEntrenado')
                    : todayDay
                      ? t('home.hoyToca')
                      : program
                        ? t('home.sinSesionProgramada')
                        : t('home.entrenar')}
              </p>
              <h2 className="mt-1.5 font-display text-[2.6rem] font-bold leading-[0.95] tracking-tight text-fg">
                {hasActiveWorkout
                  ? t('home.letsGo')
                  : todayDay
                    ? todayDay.name
                    : program
                      ? t('home.diaDeDescanso')
                      : t('home.sinPlanHoy')}
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
                  {t('home.heroSinRutina')}
                </p>
              )}
            </div>
            <div className="shrink-0">
              <ProgressRing
                value={hasActiveWorkout ? sessionPct : programPct}
                label={hasActiveWorkout ? t('home.progresoSesion') : t('home.progresoPrograma')}
              />
            </div>
          </div>

          <div className="mt-5">
            {hasActiveWorkout ? (
              <Button
                size="md"
                className="w-full"
                onClick={() => navigate('/entrenamiento/active')}
              >
                <Dumbbell className="size-5" />
                {t('home.continuarEntreno')}
              </Button>
            ) : todayDay ? (
              <Button size="md" className="w-full" onClick={handleStart}>
                <Play className="size-5" fill="currentColor" />
                {todayDone ? t('home.entrenarOtraVez') : t('home.empezarHoy')}
              </Button>
            ) : program ? (
              <Button size="md" className="w-full" onClick={handleStart}>
                <Play className="size-5" fill="currentColor" />
                {t('home.iniciarEntrenamiento')}
              </Button>
            ) : (
              <ButtonLink size="md" className="w-full" to="/rutinas">
                {t('home.verRutinas')}
              </ButtonLink>
            )}
          </div>
          </div>
        </section>

        <div className="reveal reveal-1 grid grid-cols-2 gap-3">
          <div className="panel rounded-2xl p-4">
            <Flame className="mb-2 size-5 text-cta" aria-hidden />
            <p className="kicker">{t('home.racha')}</p>
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
            <p className="kicker">{t('home.volumenSem')}</p>
            <p className="stat-value mt-1 text-3xl">
              {weeklyVolumeValue > 0 ? formatVolume(weeklyVolumeValue) : '—'}
            </p>
          </div>
        </div>

        {volumeInsight && (
          <InsightCard insight={volumeInsight} units={formatUnits(settings.units)} />
        )}

        <section className="panel-light rounded-2xl p-4">
          <WeekCalendar trained={trainedDates} program={program ?? null} routineDaysCount={routine?.daysCount ?? 0} />
        </section>

        <section className="panel flex items-center gap-4 rounded-2xl p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="kicker">
                {hasActiveWorkout ? t('home.sesionEnCurso') : t('home.programaActivo')}
              </p>
              {deloadActive && !hasActiveWorkout && (
                <span className="chip">
                  {t('home.semanaDeload')}
                </span>
              )}
            </div>
            <p className="font-display text-base font-semibold text-fg">
              {hasActiveWorkout
                ? t('home.seriesContadas', {
                    completadas: sessionCompleted,
                    total: sessionTotal || '—',
                  })
                : routine
                  ? routine.title
                  : t('home.eligeRutinaSigueme')}
            </p>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg"
              role="progressbar"
              aria-valuenow={hasActiveWorkout ? sessionPct : programPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('home.progreso')}
            >
              <div
                className="gold-gradient h-full rounded-full transition-[width] duration-300"
                style={{ width: `${hasActiveWorkout ? sessionPct : programPct}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                to="/calendario"
                className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-border px-2 text-xs text-accent-soft"
              >
                <CalendarDays className="size-3.5" /> {t('home.calendario')}
              </Link>
              <Link
                to="/cuerpo"
                className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-border px-2 text-xs text-accent-soft"
              >
                <Activity className="size-3.5" /> {t('home.cuerpo')}
              </Link>
            </div>
          </div>
        </section>

        {program && !hasActiveWorkout && (
          <section className="panel-light rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-sm font-semibold text-fg">{t('home.semanaDeDeload')}</p>
                  <InfoTip label={t('home.deloadTipLabel')}>
                    {t('home.deloadTipCuerpo')}
                  </InfoTip>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  {t('home.deloadDescripcion')}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={deloadActive}
                aria-label={t('home.activarSemanaDeload')}
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
            </div>
          </section>
        )}

        <section className="panel-light rounded-2xl p-4">
          <h2 className="font-display text-lg text-accent">{t('home.ultimoEntreno')}</h2>
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
                {/* Fecha en hora local: se añade mediodía (T12:00:00) para evitar desfases de zona horaria. */}
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-fg">
                    {formatDate(
                      localDateOf(lastWorkout) +
                        'T12:00:00',
                      lang,
                      { day: 'numeric', month: 'short' },
                    )}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDate(lastWorkout.startedAt, lang, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {Math.round(applyUnits(lastWorkout.totalVolume, settings.units)).toLocaleString()}{' '}
                  {formatUnits(settings.units)}
                  {lastWorkout.finishedAt
                    ? t('home.minSufijo', { min: workoutDurationMin(lastWorkout) })
                    : ''}
                </span>
              </span>
            </Link>
          ) : (
            <p className="mt-1 text-sm text-muted">{t('home.sinSesiones')}</p>
          )}
        </section>

        {workouts.length > 1 && (
          <section className="panel-light rounded-2xl p-4">
            <h2 className="mb-3 font-display text-lg text-accent">{t('home.historialReciente')}</h2>
            <WorkoutHistoryTimeline workouts={workouts} units={settings.units} startFrom={1} max={5} />
          </section>
        )}
      </div>
    </div>
  )
}
