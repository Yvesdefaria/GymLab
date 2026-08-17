// Página de sesión activa (/entrenamiento/:id): series, timer de descanso, PRs y resumen final.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Save, Flame, Scale, Trophy, Clock, Dumbbell, Sparkles, TrendingUp, Link2, CheckCheck } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { SwipeRow } from '@/components/ui/SwipeRow'
import { ExerciseBlock } from '@/components/workout/ExerciseBlock'
import { RestTimer } from '@/components/workout/RestTimer'
import { ElapsedClock } from '@/components/workout/ElapsedClock'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { PlateCalculatorModal } from '@/components/workout/PlateCalculatorModal'
import { SessionJournalSheet } from '@/components/journal/SessionJournalSheet'
import { Button, ButtonLink } from '@/components/ui/Button'
import { UndoToast } from '@/components/ui/UndoToast'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import anime from 'animejs'
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

// Agrupa SOLO los ejercicios consecutivos que comparten superset para renderizarlos juntos
// en el mismo slide del carrusel; un ejercicio sin superset ocupa su propio slide.
const groupExercises = (exercises: ActiveExercise[]): ExerciseGroup[] => {
  const groups: ExerciseGroup[] = []
  for (const ex of exercises) {
    const label = ex.supersetGroup ?? null
    const last = groups[groups.length - 1]
    if (label && last && last.label === label) {
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
    className={`panel flex w-max min-w-[190px] items-center gap-3 rounded-2xl p-3 text-left ${
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
  const [showJournal, setShowJournal] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [summary, setSummary] = useState<{
    workoutId: number
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
    // Lleva el carrusel hasta el ejercicio recién añadido (último slide).
    requestAnimationFrame(() => {
      const el = carouselRef.current
      if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
    })
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
        workoutId: result.workoutId,
        totalVolume: result.totalVolume,
        completedSets: result.completedSets,
        totalSets: result.totalSets,
        durationMin: result.durationMin,
        prCount: result.prCount,
        exerciseCount: result.exerciseCount,
        streak: streakInfo.currentStreak,
        skippedSets: result.skippedSets,
      })
      setShowJournal(true)
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
  const focusedGroups = useRef<Set<string>>(new Set())
  const isFirstRun = useRef(true)
  const prevIndexRef = useRef(0)

  // Transición del carrusel: el scroll-snap ya mueve el slide en horizontal; esta animación
  // complementa ese movimiento con una entrada direccional (desde donde vino el swipe) y un
  // ligero "settle" de escala, sin fade de opacidad para que no parezca un parpadeo.
  useEffect(() => {
    if (groups.length <= 1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = carouselRef.current
    const slide = el?.children[activeIndex]
    const card = slide?.querySelector('[data-carousel-card]')
    if (!card) return
    const prev = prevIndexRef.current
    const dir = activeIndex > prev ? 1 : activeIndex < prev ? -1 : 0
    prevIndexRef.current = activeIndex
    const anim = anime({
      targets: card,
      translateX: [dir * 48, 0],
      scale: [0.98, 1],
      duration: 420,
      easing: 'cubicBezier(0.16, 1, 0.3, 1)',
    })
    // Las partes internas del card (header del ejercicio + bloques de series) entran en
    // cascada desde abajo para reforzar la sensación de "nuevo ejercicio llegando".
    const parts = Array.from(card.querySelectorAll('[data-carousel-part]'))
    if (parts.length > 0) {
      anime({
        targets: parts,
        translateY: [14, 0],
        duration: 380,
        delay: anime.stagger(60, { start: 40 }),
        easing: 'easeOutCubic',
      })
    }
    return () => anim.pause()
  }, [activeIndex, groups.length])

  // Auto-avance del carrusel: al completar un grupo entero, lleva la vista al siguiente grupo incompleto.
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
        const el = carouselRef.current
        if (!el) break
        const nextIdx = groups.findIndex((g) => g.key === next.key)
        const smooth = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        el.scrollTo({ left: nextIdx * el.clientWidth, behavior: smooth })
      }
      break
    }
  }, [groups, exercises])

  // Sincroniza el indicador de posición con el slide visible del carrusel.
  const handleCarouselScroll = () => {
    const el = carouselRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    if (idx !== activeIndex) setActiveIndex(idx)
  }

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

          <SwipeRow className="flex w-full max-w-sm gap-3">
            <StatCard icon={Flame} label={t('session.volumen')} value={`${Math.round(applyUnits(summary.totalVolume, settings.units)).toLocaleString()} ${formatUnits(settings.units)}`} />
            <StatCard icon={Dumbbell} label={t('session.series')} value={`${summary.completedSets}/${summary.totalSets}`} />
            <StatCard icon={Clock} label={t('session.duracion')} value={t('session.min', { min: summary.durationMin })} />
            <StatCard
              icon={summary.prCount > 0 ? Trophy : TrendingUp}
              label={summary.prCount > 0 ? t('session.prs') : t('session.racha')}
              value={summary.prCount > 0 ? `+${summary.prCount}` : t('session.streakD', { count: summary.streak })}
              highlight={summary.prCount > 0}
            />
          </SwipeRow>

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
        {showJournal && (
          <SessionJournalSheet
            workoutId={summary.workoutId}
            onClose={() => setShowJournal(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col">
      <div className="shrink-0 space-y-2.5 border-b border-border/60 bg-bg/90 px-4 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <BackLink to="/" onClick={handleLeave} />
          <span className="kicker">
            {groups.length > 1
              ? t('session.ejercicioDe', { actual: Math.min(activeIndex + 1, groups.length), total: groups.length })
              : t('session.ejercicioUnico')}
          </span>
          <button
            onClick={() => setShowPlates(true)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border bg-bg-elevated px-3 text-xs font-medium text-muted transition-colors hover:border-cta hover:text-accent-soft"
          >
            <Scale className="size-4" aria-hidden />
            {t('session.calculadoraDiscos')}
          </button>
        </div>

        <div className="panel flex items-center gap-4 rounded-2xl p-3">
          <ProgressRing value={pct} size={64} stroke={7} label={t('session.progresoSesion')} />
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
            <div>
              <p className="kicker">{t('session.volumen')}</p>
              <p className="stat-value mt-0.5 text-xl">
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
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="flex h-full snap-x snap-mandatory overflow-x-auto px-3"
          style={{ scrollbarWidth: 'none' }}
        >
          {exercises.length === 0 && (
            <div className="h-full w-full shrink-0 snap-center px-4">
              <div className="rounded-2xl border border-dashed border-gold/40 bg-bg-elevated/50 p-8 text-center">
                <p className="font-display text-base font-semibold text-fg">
                  {t('session.empecemos')}
                </p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
                  {t('session.primerEjercicio')}
                </p>
              </div>
            </div>
          )}

          {groups.map((group) => {
            const isSuper = group.label !== null
            const complete = isGroupComplete(group)
            return (
              <div
                key={group.key}
                className="h-full w-full shrink-0 snap-center overflow-y-auto px-4 pb-4"
              >
                <div
                  data-carousel-card
                  className={
                    isSuper
                      ? `space-y-3 rounded-2xl border p-2 transition-[transform,opacity] will-change-transform ${
                          complete ? 'border-success/40 bg-success/5' : 'border-cta/40 bg-cta/5'
                        }`
                      : undefined
                  }
                >
                  {isSuper && (
                    <div data-carousel-part className="flex items-center gap-2 px-2 pt-1">
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
              </div>
            )
          })}
        </div>

        {groups.length > 1 && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2">
            <div className="flex gap-1.5">
              {groups.map((g, i) => (
                <span
                  key={g.key}
                  className={`h-1.5 rounded-full transition-all ${
                    i === Math.min(activeIndex, groups.length - 1) ? 'w-4 bg-cta' : 'w-1.5 bg-border'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border/60 bg-bg/90 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="grid grid-cols-[auto_1fr] items-center gap-2">
          <button
            onClick={() => setShowPicker(true)}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gold/40 bg-bg-elevated/50 px-4 text-sm font-medium text-muted transition-colors hover:border-cta hover:text-accent-soft"
          >
            <Plus className="size-5" />
            {t('session.anadirEjercicio')}
          </button>

          {exercises.length > 0 && (
            <Button
              size="md"
              className="w-full"
              onClick={handleFinish}
              disabled={saving}
            >
              <Save className="size-5" />
              {saving ? t('session.guardando') : t('session.finalizarEntreno')}
            </Button>
          )}
        </div>
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
