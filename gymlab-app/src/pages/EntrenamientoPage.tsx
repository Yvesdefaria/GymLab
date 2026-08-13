// Página de sesión activa (/entrenamiento/:id): series, timer de descanso, PRs y resumen final.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Save, Flame, Scale, Trophy, Clock, Dumbbell, Sparkles, TrendingUp, Link2, CheckCheck } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { ExerciseBlock } from '@/components/workout/ExerciseBlock'
import { RestTimer } from '@/components/workout/RestTimer'
import { ElapsedClock } from '@/components/workout/ElapsedClock'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { PlateCalculatorModal } from '@/components/workout/PlateCalculatorModal'
import { Button, ButtonLink } from '@/components/ui/Button'
import { UndoToast } from '@/components/ui/UndoToast'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
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
import { playBoxingBellSound, vibrate } from '@/lib/feedback'
import type { ActiveExercise, ActiveSet } from '@/store/activeWorkoutStore'

interface ExerciseGroup {
  key: string
  label: string | null
  exercises: ActiveExercise[]
}

// Agrupa los ejercicios consecutivos que comparten superset para renderizarlos juntos.
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

// Un grupo (superset) está completo solo si todos sus ejercicios tienen todas las series hechas.
const isGroupComplete = (g: ExerciseGroup): boolean =>
  g.exercises.every((ex) => ex.sets.length > 0 && ex.sets.every((s) => s.completed))

// Tarjeta de estadística del resumen final (volumen, series, duración, PRs/racha).
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

// Direcciones de partículas para la animación de celebración al batir un PR.
const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2
  const dist = 44 + (i % 3) * 14
  return {
    tx: Math.round(Math.cos(angle) * dist),
    ty: Math.round(Math.sin(angle) * dist),
  }
})

// Sesión activa: todo el flujo de registro reside en activeWorkoutStore (Zustand) y hooks.
export const EntrenamientoPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showPicker, setShowPicker] = useState(false)
  const [showPlates, setShowPlates] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [zeroWeightConfirm, setZeroWeightConfirm] = useState(0)
  const [summary, setSummary] = useState<{
    totalVolume: number
    completedSets: number
    totalSets: number
    durationMin: number
    prCount: number
    exerciseCount: number
    streak: number
    skippedSets: number
  } | null>(null)

  const exercises = useActiveWorkoutStore((s) => s.exercises)
  const startedAt = useActiveWorkoutStore((s) => s.startedAt)
  const restSeconds = useActiveWorkoutStore((s) => s.restSeconds)
  const completeExercise = useActiveWorkoutStore((s) => s.completeExercise)
  const startRest = useActiveWorkoutStore((s) => s.startRest)
  const pushUndo = useActiveWorkoutStore((s) => s.pushUndo)
  const { prMap } = usePRs()
  const streakInfo = useStreak()
  const { settings } = useSettings()
  const { startFreeExercise } = useStartSession()
  const finishWorkout = useFinishWorkout(prMap)
  const notesMap = useExerciseNotesMap(exercises.map((ex) => ex.exerciseId))

  // Sesión «viva» = iniciada, con ejercicios y sin resumen mostrado; mantiene pantalla encendida.
  const hasActiveSession = startedAt !== null && exercises.length > 0 && !summary
  useWakeLock(settings.keepScreenAwake && hasActiveSession)

  // Avisa antes de cerrar/recargar el navegador si hay sesión en curso y la preferencia lo pide.
  useEffect(() => {
    if (!hasActiveSession || !settings.confirmLeaveSession) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasActiveSession, settings.confirmLeaveSession])

  // Bloquea el enlace «atrás» mostrando el sheet de confirmación si hay sesión sin guardar.
  const handleLeave = (e: React.MouseEvent) => {
    if (!hasActiveSession || !settings.confirmLeaveSession) return
    e.preventDefault()
    setConfirmLeave(true)
  }

  // Al marcar una serie: feedback sonoro/vibración y arranque automático del descanso si está activo.
  const handleSetCompleted = (_set: ActiveSet, completed: boolean) => {
    if (!completed) return
    playBoxingBellSound()
    if (settings.restVibrate) vibrate(60)
    if (settings.autoStartRest && restSeconds > 0) startRest()
  }

  // Añade un ejercicio libre a la sesión (con precarga de último peso según ajustes).
  const handleAddExercise = async (exerciseId: number, exerciseName: string) => {
    await startFreeExercise(exerciseId, exerciseName)
    setShowPicker(false)
  }

  // Elimina un ejercicio de la sesión, guardando la acción para poder deshacerla (UndoToast).
  const handleRemoveExercise = (exerciseId: number) => {
    const ex = exercises.find((e) => e.exerciseId === exerciseId)
    if (!ex) return
    pushUndo(ex.exerciseName)
    useActiveWorkoutStore.getState().removeExercise(exerciseId)
  }

  // Elimina una serie concreta y deja registrada la acción en el histórico de deshacer.
  const handleRemoveSet = (exerciseId: number, setId: string) => {
    const ex = exercises.find((e) => e.exerciseId === exerciseId)
    const set = ex?.sets.find((s) => s.id === setId)
    pushUndo(
      set
        ? t('session.serieDe', { numero: set.setNumber, ejercicio: ex?.exerciseName ?? '' })
        : t('session.serie')
    )
    useActiveWorkoutStore.getState().removeSet(exerciseId, setId)
  }

  // Finaliza la sesión: avisa con un sheet si hay series sin peso (no suman volumen/PR).
  const handleFinish = () => {
    if (saving || exercises.length === 0) return
    const zeroWeightCount = exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.completed && s.weightKg <= 0).length,
      0
    )
    if (zeroWeightCount > 0) {
      setZeroWeightConfirm(zeroWeightCount)
      return
    }
    void doFinish()
  }

  // Persiste la sesión en Dexie y prepara el resumen; se reutiliza tras confirmar series sin peso.
  const doFinish = async () => {
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
        skippedSets: result.skippedSets,
      })
      setSaving(false)
    } catch {
      setSaving(false)
      window.alert(t('session.guardarError'))
    }
  }

  // Estadísticas en vivo de la sesión para la cabecera y el anillo de progreso.
  const { totalVolume, completedSets, totalSets } = useMemo(
    () => computeSessionStats(exercises),
    [exercises]
  )
  const pct = sessionProgressPct(completedSets, totalSets)

  const groups = useMemo(() => groupExercises(exercises), [exercises])
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const focusedGroups = useRef<Set<string>>(new Set())
  const isFirstRun = useRef(true)

  // Auto-scroll: al completar un grupo entero, lleva la vista al siguiente grupo incompleto.
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

  // Pantalla de resumen: mensaje adaptado a si hubo PRs, racha activa o entreno normal.
  if (summary) {
    const headline = summary.prCount > 0
      ? t('session.resumenPr')
      : summary.streak >= 3
        ? t('session.resumenRacha')
        : t('session.resumenBuenEntreno')
    const kicker =
      summary.prCount > 0
        ? t('session.prNuevos', { count: summary.prCount })
        : summary.streak >= 3
          ? t('session.diasSeguidos', { count: summary.streak })
          : t('session.cadaSerieCuenta')

    return (
      <div className="min-h-dvh bg-bg">
        <AppHeader title={t('session.entrenoCompletado')} />
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

          <ProgressRing value={100} label={t('session.sesionCompleta')} />

          <div className="grid w-full max-w-sm grid-cols-2 gap-3">
            <StatCard icon={Flame} label={t('session.volumen')} value={`${Math.round(applyUnits(summary.totalVolume, settings.units)).toLocaleString()} ${formatUnits(settings.units)}`} />
            <StatCard icon={Dumbbell} label={t('session.series')} value={`${summary.completedSets}/${summary.totalSets}`} />
            <StatCard icon={Clock} label={t('session.duracion')} value={t('session.min', { min: summary.durationMin })} />
            <StatCard
              icon={summary.prCount > 0 ? Trophy : TrendingUp}
              label={summary.prCount > 0 ? t('session.prs') : t('session.racha')}
              value={summary.prCount > 0 ? `+${summary.prCount}` : t('session.streakD', { count: summary.streak })}
              highlight={summary.prCount > 0}
            />
          </div>

          <div className="flex w-full max-w-sm flex-col gap-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate('/')}
            >
              <Flame className="size-5" />
              {t('session.volverAlInicio')}
            </Button>
            <ButtonLink
              to="/perfil"
              variant="outline"
              className="w-full"
            >
              {t('session.verMiProgreso')}
            </ButtonLink>
          </div>

          <p className="text-xs text-muted">
            {t('session.ejerciciosRegistrados', { count: summary.exerciseCount })}
          </p>
          {summary.skippedSets > 0 && (
            <p role="status" className="max-w-xs text-xs text-danger/80">
              {t('session.seriesVacias', { count: summary.skippedSets })}.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHeader
        title={t('session.titulo')}
        subtitle={t('session.subtitulo', {
          count: exercises.length,
          completadas: completedSets,
          total: totalSets,
        })}
      />
      <div className="space-y-3 p-4 pb-8">
        <BackLink to="/" onClick={handleLeave} />

        <div className="panel-hero flex items-center gap-4 rounded-2xl p-4">
          <ProgressRing value={pct} label={t('session.progresoSesion')} />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="kicker">{t('session.volumen')}</p>
              <p className="stat-value mt-0.5 text-2xl">
                {Math.round(applyUnits(totalVolume, settings.units)).toLocaleString()}{' '}
                {formatUnits(settings.units)}
              </p>
            </div>
            <div>
              <p className="kicker">{t('session.tiempo')}</p>
              <ElapsedClock startedAt={startedAt} />
            </div>
          </div>
        </div>

        <RestTimer />

        <div className="flex justify-end">
          <button
            onClick={() => setShowPlates(true)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border bg-bg-elevated px-3 text-xs font-medium text-muted transition-colors hover:border-cta hover:text-accent-soft"
          >
            <Scale className="size-4" aria-hidden />
            {t('session.calculadoraDiscos')}
          </button>
        </div>

        {exercises.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gold/40 bg-bg-elevated/50 p-8 text-center">
            <p className="font-display text-base font-semibold text-fg">
              {t('session.empecemos')}
            </p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
              {t('session.primerEjercicio')}
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
                    {t('session.superserie', { grupo: group.label })}
                  </span>
                  {complete ? (
                    <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-success">
                      <CheckCheck className="size-3" aria-hidden /> {t('session.completada')}
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
          {t('session.anadirEjercicio')}
        </button>

        {exercises.length > 0 && (
          <Button
            size="lg"
            className="w-full"
            onClick={handleFinish}
            disabled={saving}
          >
            <Save className="size-5" />
            {saving ? t('session.guardando') : t('session.finalizarEntreno')}
          </Button>
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

      {confirmLeave && (
        <ConfirmSheet
          title={t('session.salirSinGuardar')}
          message={t('session.salirSinGuardarMensaje')}
          confirmLabel={t('session.salir')}
          cancelLabel={t('session.seguirEntrenando')}
          onConfirm={() => {
            setConfirmLeave(false)
            navigate('/')
          }}
          onCancel={() => setConfirmLeave(false)}
        />
      )}

      {zeroWeightConfirm > 0 && (
        <ConfirmSheet
          title={t('session.seriesSinPeso')}
          message={t('session.seriesSinPesoMensaje', { count: zeroWeightConfirm })}
          confirmLabel={t('session.guardarIgualmente')}
          cancelLabel={t('session.revisarSeries')}
          onConfirm={() => {
            setZeroWeightConfirm(0)
            void doFinish()
          }}
          onCancel={() => setZeroWeightConfirm(0)}
        />
      )}

      <UndoToast />
    </div>
  )
}
