// Lógica completa de la sesión activa: estado, efectos de guardia (warmup, salida, back físico)
// y acciones de serie/ejercicio/guardado, desacoplada de la presentación (F92).
import { useEffect, useMemo, useRef, useState } from 'react'
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
import { playBoxingBellSound, vibrate } from '@/lib/feedback'
import type { ActiveSet } from '@/store/activeWorkoutStore'
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
  const restSeconds = useActiveWorkoutStore((s) => s.restSeconds)
  const completeExercise = useActiveWorkoutStore((s) => s.completeExercise)
  const startRest = useActiveWorkoutStore((s) => s.startRest)
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

  // Muestra calentamiento guiado al inicio de la sesión (una vez; el ref evita reabrirlo al cerrarlo).
  const warmupShown = useRef(false)
  useEffect(() => {
    if (hasActiveSession && exercises.length > 0 && !summary && !warmupShown.current) {
      warmupShown.current = true
      setShowWarmup(true)
    }
  }, [hasActiveSession, exercises.length, summary])

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
  const handleSetCompleted = (set: ActiveSet, completed: boolean) => {
    if (!completed) return
    playBoxingBellSound()
    if (settings.restVibrate) vibrate(60)
    if (settings.autoStartRest && restSeconds > 0) startRest()
    const exercise = exercises.find((e) => e.sets.some((s) => s.id === set.id))
    if (exercise) {
      const catalogEx = catalogExercises.find((c) => c.id === exercise.exerciseId)
      setLastCompletedExercise({
        muscleGroup: catalogEx?.muscleGroup,
        exerciseName: exercise.exerciseName,
        rpe: set.rpe,
        rir: set.rir,
      })
    }
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