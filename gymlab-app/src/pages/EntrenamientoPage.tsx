import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Save, Flame, Scale, Trophy, Clock, Dumbbell, Sparkles, TrendingUp, Link2, CheckCheck } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { ExerciseBlock } from '@/components/workout/ExerciseBlock'
import { RestTimer } from '@/components/workout/RestTimer'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { PlateCalculatorModal } from '@/components/workout/PlateCalculatorModal'
import { UndoToast } from '@/components/ui/UndoToast'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { usePRs } from '@/hooks/usePRs'
import { useStreak } from '@/hooks/useStreak'
import { useSettings, useWakeLock } from '@/hooks/useSettings'
import { applyUnits, formatUnits } from '@/domain/settings'
import { useStartSession } from '@/hooks/useStartSession'
import { useExerciseNotesMap } from '@/hooks/useExerciseNote'
import { useFinishWorkout } from '@/hooks/useFinishWorkout'
import { sessionProgressPct, computeSessionStats } from '@/domain/sessionProgress'
import { formatElapsedClock } from '@/domain/workouts'
import { playSetCompleteSound, vibrate } from '@/lib/feedback'
import type { ActiveExercise, ActiveSet } from '@/store/activeWorkoutStore'

interface ExerciseGroup {
  key: string
  label: string | null
  exercises: ActiveExercise[]
}

const groupExercises = (exercises: ActiveExercise[]): ExerciseGroup[] => {
  const groups: ExerciseGroup[] = []
  for (const ex of exercises) {
    const label = ex.supersetGroup ?? null
    const last = groups[groups.length - 1]
    if (last && last.label === label) {
      last.exercises.push(ex)
    } else {
      groups.push({ key: label ?? `solo-${ex.exerciseId}`, label, exercises: [ex] })
    }
  }
  return groups
}

const isGroupComplete = (g: ExerciseGroup): boolean =>
  g.exercises.every((ex) => ex.sets.length > 0 && ex.sets.every((s) => s.completed))

const StatCard = ({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Flame
  label: string
  value: string
  highlight?: boolean
}) => (
  <div
    className={`panel flex items-center gap-3 rounded-2xl p-3 text-left ${
      highlight ? 'border-cta/50 bg-cta/10' : ''
    }`}
  >
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
        highlight ? 'bg-cta/20 text-accent-soft' : 'bg-bg text-muted'
      }`}
    >
      <Icon className="size-5" />
    </span>
    <div className="min-w-0">
      <p className="kicker">{label}</p>
      <p className="stat-value mt-0.5 text-lg leading-tight">{value}</p>
    </div>
  </div>
)

const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2
  const dist = 44 + (i % 3) * 14
  return {
    tx: Math.round(Math.cos(angle) * dist),
    ty: Math.round(Math.sin(angle) * dist),
  }
})

export const EntrenamientoPage = () => {
  const navigate = useNavigate()
  const [showPicker, setShowPicker] = useState(false)
  const [showPlates, setShowPlates] = useState(false)
  const [saving, setSaving] = useState(false)
  const [summary, setSummary] = useState<{
    totalVolume: number
    completedSets: number
    totalSets: number
    durationMin: number
    prCount: number
    exerciseCount: number
    streak: number
  } | null>(null)

  const {
    exercises,
    startedAt,
    restSeconds,
    completeExercise,
    startRest,
    pushUndo,
  } = useActiveWorkoutStore()
  const { prMap } = usePRs()
  const streakInfo = useStreak()
  const { settings } = useSettings()
  const { startFreeExercise } = useStartSession()
  const finishWorkout = useFinishWorkout(prMap)
  const notesMap = useExerciseNotesMap(exercises.map((ex) => ex.exerciseId))

  const hasActiveSession = startedAt !== null && exercises.length > 0 && !summary
  useWakeLock(settings.keepScreenAwake && hasActiveSession)

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!startedAt) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [startedAt])

  useEffect(() => {
    if (!hasActiveSession || !settings.confirmLeaveSession) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasActiveSession, settings.confirmLeaveSession])

  const handleLeave = (e: React.MouseEvent) => {
    if (!hasActiveSession || !settings.confirmLeaveSession) return
    if (!window.confirm('Tienes una sesión en curso. ¿Salir sin guardar?')) {
      e.preventDefault()
    }
  }

  const handleSetCompleted = (_set: ActiveSet, completed: boolean) => {
    if (!completed) return
    if (settings.restVibrate) vibrate(60)
    if (settings.restSound) playSetCompleteSound()
    if (settings.autoStartRest && restSeconds > 0) startRest()
  }

  const handleAddExercise = async (exerciseId: number, exerciseName: string) => {
    await startFreeExercise(exerciseId, exerciseName)
    setShowPicker(false)
  }

  const handleRemoveExercise = (exerciseId: number) => {
    const ex = exercises.find((e) => e.exerciseId === exerciseId)
    if (!ex) return
    pushUndo(ex.exerciseName)
    useActiveWorkoutStore.getState().removeExercise(exerciseId)
  }

  const handleRemoveSet = (exerciseId: number, setId: string) => {
    const ex = exercises.find((e) => e.exerciseId === exerciseId)
    const set = ex?.sets.find((s) => s.id === setId)
    pushUndo(set ? `Serie ${set.setNumber} de ${ex?.exerciseName ?? ''}` : 'Serie')
    useActiveWorkoutStore.getState().removeSet(exerciseId, setId)
  }

  const handleFinish = async () => {
    if (saving || exercises.length === 0) return
    setSaving(true)
    try {
      const result = await finishWorkout()
      if (!result) {
        setSaving(false)
        return
      }
      setSummary({
        totalVolume: result.totalVolume,
        completedSets: result.completedSets,
        totalSets: result.totalSets,
        durationMin: result.durationMin,
        prCount: result.prCount,
        exerciseCount: result.exerciseCount,
        streak: streakInfo.currentStreak,
      })
      setSaving(false)
    } catch {
      setSaving(false)
      window.alert('No se pudo guardar la sesión. Tu entreno sigue aquí, inténtalo de nuevo.')
    }
  }

  const { totalVolume, completedSets, totalSets } = useMemo(
    () => computeSessionStats(exercises),
    [exercises]
  )
  const pct = sessionProgressPct(completedSets, totalSets)

  const groups = useMemo(() => groupExercises(exercises), [exercises])
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const focusedGroups = useRef<Set<string>>(new Set())
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    for (const group of groups) {
      if (focusedGroups.current.has(group.key)) continue
      if (!isGroupComplete(group)) break
      focusedGroups.current.add(group.key)
      const idx = groups.findIndex((g) => g.key === group.key)
      const next = groups.slice(idx + 1).find((g) => !isGroupComplete(g))
      if (next) {
        const smooth = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth'
        groupRefs.current[next.key]?.scrollIntoView({ behavior: smooth, block: 'center' })
      }
      break
    }
  }, [groups, exercises])

  if (summary) {
    const headline = summary.prCount > 0
      ? '¡Has batido una marca!'
      : summary.streak >= 3
        ? 'La racha sigue viva'
        : '¡Buen entreno!'
    const kicker =
      summary.prCount > 0
        ? `${summary.prCount} ${summary.prCount === 1 ? 'PR nuevo' : 'PRs nuevos'} · sigue así`
        : summary.streak >= 3
          ? `${summary.streak} días seguidos. Eso es enorme.`
          : 'Cada serie cuenta. Volviste a presentarte.'

    return (
      <div className="min-h-dvh bg-bg">
        <AppHeader title="Entreno completado" />
        <div className="flex flex-col items-center gap-6 px-5 pb-28 pt-6 text-center">
          <div className="relative">
            {summary.prCount > 0 &&
              PARTICLES.map((p, i) => (
                <span
                  key={i}
                  className="burst-particle"
                  style={
                    {
                      '--tx': `${p.tx}px`,
                      '--ty': `${p.ty}px`,
                      animationDelay: `${i * 0.03}s`,
                    } as React.CSSProperties
                  }
                />
              ))}
            <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-cta/20 blur-2xl" />
            <div className="flex size-20 items-center justify-center rounded-full bg-cta/15 ring-1 ring-cta/40">
              {summary.prCount > 0 ? (
                <Trophy className="size-10 text-cta" strokeWidth={2.2} />
              ) : (
                <Flame className="size-10 text-cta" strokeWidth={2.2} />
              )}
            </div>
            {summary.prCount > 0 && (
              <Sparkles className="absolute -right-2 -top-1 size-6 text-cta" />
            )}
          </div>

          <div className="space-y-1">
            <h2 className="font-display text-2xl font-bold tracking-tight text-fg">
              {headline}
            </h2>
            <p className="mx-auto max-w-xs text-sm text-muted">{kicker}</p>
          </div>

          <ProgressRing value={100} label="Sesión completa" />

          <div className="grid w-full max-w-sm grid-cols-2 gap-3">
            <StatCard icon={Flame} label="Volumen" value={`${Math.round(applyUnits(summary.totalVolume, settings.units)).toLocaleString()} ${formatUnits(settings.units)}`} />
            <StatCard icon={Dumbbell} label="Series" value={`${summary.completedSets}/${summary.totalSets}`} />
            <StatCard icon={Clock} label="Duración" value={`${summary.durationMin} min`} />
            <StatCard
              icon={summary.prCount > 0 ? Trophy : TrendingUp}
              label={summary.prCount > 0 ? 'PRs' : 'Racha'}
              value={summary.prCount > 0 ? `+${summary.prCount}` : `${summary.streak} d`}
              highlight={summary.prCount > 0}
            />
          </div>

          <div className="flex w-full max-w-sm flex-col gap-3">
            <button
              onClick={() => navigate('/')}
              className="gold-gradient flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-6 font-display text-base font-semibold text-on-gold shadow-lg shadow-cta/10 transition-transform active:scale-[0.98]"
            >
              <Flame className="size-5" />
              Volver al inicio
            </button>
            <Link
              to="/perfil"
              className="flex min-h-[48px] items-center justify-center rounded-2xl border border-gold/40 px-6 text-sm font-medium text-accent-soft transition-colors hover:border-cta hover:text-accent"
            >
              Ver mi progreso
            </Link>
          </div>

          <p className="text-xs text-muted">
            {summary.exerciseCount === 1
              ? '1 ejercicio registrado. Míralo en tu perfil cuando quieras.'
              : `${summary.exerciseCount} ejercicios registrados. Míralos en tu perfil cuando quieras.`}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHeader
        title="Sesión"
        subtitle={`${exercises.length} ejercicios · ${completedSets}/${totalSets} series`}
      />
      <div className="space-y-3 p-4 pb-8">
        <BackLink to="/" onClick={handleLeave} />

        <div className="panel-hero flex items-center gap-4 rounded-2xl p-4">
          <ProgressRing value={pct} label="Progreso de la sesión" />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="kicker">Volumen</p>
              <p className="stat-value mt-0.5 text-2xl">
                {Math.round(applyUnits(totalVolume, settings.units)).toLocaleString()}{' '}
                {formatUnits(settings.units)}
              </p>
            </div>
            <div>
              <p className="kicker">Tiempo</p>
              <p className="stat-value mt-0.5 text-2xl tabular-nums">
                {formatElapsedClock(startedAt ? (now - new Date(startedAt).getTime()) / 1000 : 0)}
              </p>
            </div>
          </div>
        </div>

        <RestTimer />

        <div className="flex justify-end">
          <button
            onClick={() => setShowPlates(true)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-border bg-bg-elevated px-3 text-xs font-medium text-muted transition-colors hover:border-cta hover:text-accent-soft"
          >
            <Scale className="size-4" aria-hidden />
            Calculadora de discos
          </button>
        </div>

        {exercises.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gold/40 bg-bg-elevated/50 p-8 text-center">
            <p className="font-display text-base font-semibold text-fg">
              Empecemos
            </p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
              Añade tu primer ejercicio con la carga de la semana pasada ya precargada.
            </p>
          </div>
        )}

        {groups.map((group) => {
          const isSuper = group.label !== null
          const complete = isGroupComplete(group)
          return (
            <div
              key={group.key}
              ref={(el) => {
                groupRefs.current[group.key] = el
              }}
              className={
                isSuper
                  ? `space-y-3 rounded-2xl border p-2 ${
                      complete ? 'border-success/40 bg-success/5' : 'border-cta/40 bg-cta/5'
                    }`
                  : undefined
              }
            >
              {isSuper && (
                <div className="flex items-center gap-2 px-2 pt-1">
                  <Link2 className="size-4 shrink-0 text-cta" aria-hidden />
                  <span className="font-display text-sm font-semibold uppercase tracking-wide text-accent-soft">
                    Superserie {group.label}
                  </span>
                  {complete ? (
                    <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-success">
                      <CheckCheck className="size-3" aria-hidden /> Completada
                    </span>
                  ) : null}
                </div>
              )}
              {group.exercises.map((ex) => (
                <ExerciseBlock
                  key={ex.exerciseId}
                  exercise={ex}
                  prMap={prMap}
                  showRpe={settings.showRpe}
                  showRir={settings.showRir}
                  units={settings.units}
                  note={notesMap.get(ex.exerciseId)}
                  onCompleteExercise={() => completeExercise(ex.exerciseId)}
                  onSetCompleted={handleSetCompleted}
                  onRemoveRequest={handleRemoveExercise}
                  onSetRemoveRequest={handleRemoveSet}
                />
              ))}
            </div>
          )
        })}

        <button
          onClick={() => setShowPicker(true)}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gold/40 bg-bg-elevated/50 text-sm font-medium text-muted transition-colors hover:border-cta hover:text-accent-soft"
        >
          <Plus className="size-5" />
          Añadir ejercicio
        </button>

        {exercises.length > 0 && (
          <button
            onClick={handleFinish}
            disabled={saving}
            className="gold-gradient flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl font-display text-lg font-semibold tracking-wide text-on-gold shadow-lg shadow-cta/20 transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Save className="size-5" />
            {saving ? 'Guardando...' : 'Finalizar entreno'}
          </button>
        )}
      </div>

      {showPicker && (
        <ExercisePicker
          onSelect={(ex) => void handleAddExercise(ex.id, ex.name)}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showPlates && (
        <PlateCalculatorModal
          initialKg={0}
          onClose={() => setShowPlates(false)}
        />
      )}

      <UndoToast />
    </div>
  )
}
