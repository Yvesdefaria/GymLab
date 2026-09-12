// Lógica completa de la sesión activa: estado, efectos de guardia (warmup, salida, back físico)
// y acciones de serie/ejercicio/guardado, desacoplada de la presentación (F92).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { usePRs } from '@/hooks/usePRs'
import { useStreak } from '@/hooks/useStreak'
import { useSettings, useWakeLock } from '@/hooks/useSettings'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { useStartSession } from '@/hooks/useStartSession'
import { useExerciseNotesMap } from '@/hooks/useExerciseNote'
import { useFinishWorkout } from '@/hooks/useFinishWorkout'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { computeSessionStats, countZeroWeightSets, sessionProgressPct } from '@/domain/sessionProgress'
import { completedSetsForSuggestions, getAdaptiveSuggestions } from '@/domain/adaptiveRoutine'
import type { ActiveSetInput } from '@/domain/sessionSuggestions'
import { playBoxingBellSound, vibrate } from '@/lib/feedback'
import { track } from '@/lib/telemetry'
import type { MuscleGroup } from '@/domain/types'

// Resumen de sesión guardada que se muestra tras finalizar.
export interface SessionSummary {
  workoutId: number
  totalVolume: number
  completedSets: number
  totalSets: number
  durationMin: number
  prCount: number
  exerciseCount: number
  streak: number
  skippedSets: number
}

export const useActiveSession = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showPicker, setShowPicker] = useState(false)
  const [showPlates, setShowPlates] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [zeroWeightConfirm, setZeroWeightConfirm] = useState(0)
  const [showWarmup, setShowWarmup] = useState(false)
  const [lastCompletedExercise, setLastCompletedExercise] = useState<{
    muscleGroup?: MuscleGroup
    exerciseName: string
    rpe?: number
    rir?: number
  } | null>(null)
  const [summary, setSummary] = useState<SessionSummary | null>(null)

  const exercises = useActiveWorkoutStore((s) => s.exercises)
  const startedAt = useActiveWorkoutStore((s) => s.startedAt)
  const completeExercise = useActiveWorkoutStore((s) => s.completeExercise)
  const pushUndo = useActiveWorkoutStore((s) => s.pushUndo)
  const { prMap } = usePRs()
  const streakInfo = useStreak()
  const { settings } = useSettings()
  const { startFreeExercise } = useStartSession()
  const { exercises: catalogExercises } = useExerciseCatalog()
  const categoryFor = useMemo(() => {
    const map = new Map(catalogExercises.map((e) => [e.id, e.category ?? 'strength']))
    return (exerciseId: number) => map.get(exerciseId)
  }, [catalogExercises])
  const slugFor = useMemo(() => {
    const map = new Map(catalogExercises.map((e) => [e.id, e.slug]))
    return (exerciseId: number) => map.get(exerciseId)
  }, [catalogExercises])
  const finishWorkout = useFinishWorkout(prMap)
  const notesMap = useExerciseNotesMap(exercises.map((ex) => ex.exerciseId))
  const noteFor = useMemo(() => (exerciseId: number) => notesMap.get(exerciseId), [notesMap])
  const { routine } = useActiveProgram()

  // Sesión «viva» = iniciada, con ejercicios y sin resumen mostrado; mantiene pantalla encendida.
  const hasActiveSession = startedAt !== null && exercises.length > 0 && !summary
  useWakeLock(settings.keepScreenAwake && hasActiveSession)

  // Muestra calentamiento guiado al inicio de la sesión (una vez por sesión: el flag persiste
  // en el store para no reabrirlo tras recargar o reentrar aunque se haya saltado/terminado).
  const warmupSeen = useActiveWorkoutStore((s) => s.warmupSeen)
  const markWarmupSeen = useActiveWorkoutStore((s) => s.markWarmupSeen)
  useEffect(() => {
    if (hasActiveSession && exercises.length > 0 && !summary && !warmupSeen) {
      markWarmupSeen()
      setShowWarmup(true)
    }
  }, [hasActiveSession, exercises.length, summary, warmupSeen, markWarmupSeen])

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

  // Botón back físico de Android: confirmar antes de salir si hay sesión en curso; si no, nativo.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let cancelled = false
    const sub = App.addListener('backButton', ({ canGoBack }) => {
      if (cancelled) return
      // Con el sheet abierto, no navegar: forzar una decisión explícita.
      if (confirmLeave) return
      if (hasActiveSession && settings.confirmLeaveSession) {
        setConfirmLeave(true)
        return
      }
      if (canGoBack) {
        window.history.back()
      } else {
        void App.exitApp()
      }
    })
    return () => {
      cancelled = true
      void sub.then((s) => s.remove())
    }
  }, [hasActiveSession, settings.confirmLeaveSession, confirmLeave])

  // Al marcar una serie: feedback sonoro/vibración, arranque automático del descanso y captura del ejercicio.
  // Estable (lectura fresca del store + deps settings/catálogo): llega a los bloques memoizados
  // sin recrearse en cada render y sin re-renderizarlos por cambios ajenos (tarea 91.2).
  const handleSetCompleted = useCallback((exerciseId: number, setId: string, completed: boolean) => {
    if (!completed) return
    playBoxingBellSound()
    if (settings.restVibrate) vibrate(60)
    const { exercises, restSeconds, startRest } = useActiveWorkoutStore.getState()
    if (settings.autoStartRest && restSeconds > 0) startRest()
    const exercise = exercises.find((e) => e.exerciseId === exerciseId)
    if (exercise) {
      const set = exercise.sets.find((s) => s.id === setId)
      const catalogEx = catalogExercises.find((c) => c.id === exercise.exerciseId)
      setLastCompletedExercise({
        muscleGroup: catalogEx?.muscleGroup,
        exerciseName: exercise.exerciseName,
        rpe: set?.rpe,
        rir: set?.rir,
      })
    }
  }, [settings, catalogExercises])

  // Añade un ejercicio libre a la sesión (con precarga de último peso según ajustes).
  const handleAddExercise = async (exerciseId: number, exerciseName: string) => {
    await startFreeExercise(exerciseId, exerciseName)
    setShowPicker(false)
  }

  // Elimina un ejercicio de la sesión, guardando la acción para poder deshacerla (UndoToast).
  // Lee el estado fresco del store para no capturar `exercises` (mantiene el callback estable).
  const handleRemoveExercise = useCallback((exerciseId: number) => {
    const ex = useActiveWorkoutStore.getState().exercises.find((e) => e.exerciseId === exerciseId)
    if (!ex) return
    pushUndo(ex.exerciseName)
    useActiveWorkoutStore.getState().removeExercise(exerciseId)
  }, [pushUndo])

  // Elimina una serie concreta y deja registrada la acción en el histórico de deshacer.
  const handleRemoveSet = useCallback((exerciseId: number, setId: string) => {
    const ex = useActiveWorkoutStore.getState().exercises.find((e) => e.exerciseId === exerciseId)
    const set = ex?.sets.find((s) => s.id === setId)
    pushUndo(
      set
        ? t('session.serieDe', { numero: set.setNumber, ejercicio: ex?.exerciseName ?? '' })
        : t('session.serie')
    )
    useActiveWorkoutStore.getState().removeSet(exerciseId, setId)
  }, [t, pushUndo])

  // Finaliza la sesión: avisa con un sheet si hay series sin peso (no suman volumen/PR).
  const handleFinish = () => {
    if (saving || exercises.length === 0) return
    const zeroWeightCount = countZeroWeightSets(exercises)
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
      track('workout_completed', {
        durationMin: result.durationMin,
        exerciseCount: result.exerciseCount,
        prCount: result.prCount,
      })
      setSaving(false)
    } catch {
      setSaving(false)
      window.alert(t('session.guardarError'))
    }
  }

  // Bloquea el enlace «atrás» mostrando el sheet de confirmación si hay sesión sin guardar.
  const handleLeave = (e: React.MouseEvent) => {
    if (!hasActiveSession || !settings.confirmLeaveSession) return
    e.preventDefault()
    setConfirmLeave(true)
  }

  // Estadísticas en vivo de la sesión para la cabecera y el anillo de progreso.
  const { totalVolume, completedSets, totalSets } = useMemo(
    () => computeSessionStats(exercises),
    [exercises]
  )
  const pct = sessionProgressPct(completedSets, totalSets)

  // Series completadas formateadas para el motor de sugerencias.
  const suggestionSets = useMemo(() => completedSetsForSuggestions(exercises), [exercises])
  const adaptiveSuggestions = useMemo(
    () => getAdaptiveSuggestions(
      suggestionSets,
      exercises.map((e) => e.exerciseId),
      [...prMap.values()],
    ),
    [suggestionSets, exercises, prMap]
  )

  // Entrada del motor F63: e1RM conocido por ejercicio y series activas tal cual.
  const knownE1RM = useMemo<Record<number, number>>(
    () => Object.fromEntries([...prMap.entries()].map(([id, pr]) => [id, pr.estimated1RM])),
    [prMap]
  )
  const activeSetsInput = useMemo<ActiveSetInput[]>(
    () =>
      exercises.flatMap((ex) =>
        ex.sets.map((s) => ({
          exerciseId: ex.exerciseId,
          weightKg: s.weightKg,
          isWarmup: s.isWarmup,
          completed: s.completed,
          setNumber: s.setNumber,
        }))
      ),
    [exercises]
  )

  // Acciones de un toque de las sugerencias (undoables por ejercicio).
  const applyWeightToRemaining = useActiveWorkoutStore((s) => s.applyWeightToRemaining)
  const addWarmupSet = useActiveWorkoutStore((s) => s.addWarmupSet)
  const handleApplyWeight = (exerciseId: number, amountKg: number) => {
    const ex = exercises.find((e) => e.exerciseId === exerciseId)
    pushUndo(ex ? `${ex.exerciseName} (${amountKg > 0 ? '+' : ''}${amountKg} kg)` : 'Peso')
    applyWeightToRemaining(exerciseId, amountKg)
  }
  const handleAddWarmup = (exerciseId: number, warmupWeightKg: number) => {
    const ex = exercises.find((e) => e.exerciseId === exerciseId)
    pushUndo(ex ? `${ex.exerciseName} (warmup)` : 'Warmup')
    addWarmupSet(exerciseId, warmupWeightKg)
  }

  return {
    // estado y datos para la vista
    exercises,
    startedAt,
    totalVolume,
    completedSets,
    totalSets,
    pct,
    suggestionSets,
    adaptiveSuggestions,
    knownE1RM,
    activeSetsInput,
    lastCompletedExercise,
    saving,
    showPicker,
    showPlates,
    confirmLeave,
    zeroWeightConfirm,
    showWarmup,
    summary,
    units: settings.units,
    prMap,
    showRpe: settings.showRpe,
    showRir: settings.showRir,
    routineObjective: routine?.objective,
    categoryFor,
    slugFor,
    noteFor,
    completeExercise,
    // acciones
    openPicker: () => setShowPicker(true),
    closePicker: () => setShowPicker(false),
    openPlates: () => setShowPlates(true),
    closePlates: () => setShowPlates(false),
    handleSetCompleted,
    handleAddExercise,
    handleRemoveExercise,
    handleRemoveSet,
    handleApplyWeight,
    handleAddWarmup,
    handleFinish,
    handleLeave,
    confirmLeaveConfirm: () => {
      setConfirmLeave(false)
      navigate('/')
    },
    cancelLeave: () => setConfirmLeave(false),
    confirmZeroWeight: () => {
      setZeroWeightConfirm(0)
      void doFinish()
    },
    cancelZeroWeight: () => setZeroWeightConfirm(0),
    closeWarmup: () => setShowWarmup(false),
  }
}