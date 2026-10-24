// F132.2/B2 — descanso en dos piezas: barra fija (idle/corriendo) + sheet de opciones.
// La lógica de F96/F103/F112 se conserva: deadline, reconciliación, alerta nativa,
// Auto con recomendación, presets, sonido/vibración, pausa, reset y detener.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { MoreHorizontal, Pause, Play, RotateCcw, Sparkles } from 'lucide-react'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useSettings } from '@/hooks/useSettings'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { RestAlertNotice } from '@/components/workout/RestAlertNotice'
import { useRestAlert } from '@/hooks/useRestAlert'
import { useRestCountdown } from '@/hooks/useRestCountdown'
import { playBoxingBellSound, playRestWarningSound } from '@/lib/feedback'
import { haptics } from '@/lib/haptics'
import { formatDuration } from '@/lib/duration'
import { calcRestRecommendation } from '@/domain/restRecommendation'
import { mapToRestCategory, mapToTrainingGoal } from '@/domain/restCategoryMapper'
import type { MuscleGroup, Objective } from '@/domain/types'

const PRESETS = [30, 60, 90, 120, 180]

interface RestTimerProps {
  muscleGroup?: MuscleGroup
  exerciseName?: string
  rpe?: number
  rir?: number
  objective?: Objective
}

export const RestTimer = ({
  muscleGroup,
  exerciseName,
  rpe,
  rir,
  objective,
}: RestTimerProps) => {
  const { t } = useTranslation()
  const restSeconds = useActiveWorkoutStore((s) => s.restSeconds)
  const restEndsAt = useActiveWorkoutStore((s) => s.restEndsAt)
  const isResting = useActiveWorkoutStore((s) => s.isResting)
  const startRest = useActiveWorkoutStore((s) => s.startRest)
  const reconcileRest = useActiveWorkoutStore((s) => s.reconcileRest)
  const stopRest = useActiveWorkoutStore((s) => s.stopRest)
  const restMode = useActiveWorkoutStore((s) => s.restMode)
  const setRestMode = useActiveWorkoutStore((s) => s.setRestMode)
  const setAutoRestSeconds = useActiveWorkoutStore((s) => s.setAutoRestSeconds)
  // Repintado local de 1 Hz: el restante se deriva del deadline sin escribir el
  // store por segundo; el único set es el corte al vencer (F103/T5).
  const restRemaining = useRestCountdown(isResting, restEndsAt, restSeconds, reconcileRest)
  const { settings, update } = useSettings()
  const lastWarnedRef = useRef(-1)
  const [justFinished, setJustFinished] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Alerta nativa del descanso (F96, D3): programa/cancela la notificación y
  // expone el aviso de permisos/exactitud y el dedupe contra la alerta in-app.
  const {
    warning: restAlertWarning,
    dismissWarning,
    suppressInAppAlert,
    isNative: isNativePlatform,
  } = useRestAlert({
    title: t('notifications.restDone.title'),
    body: t('notifications.restDone.body'),
  })

  // Calcula recomendación de descanso si hay datos del ejercicio.
  const recommendation = useMemo(() => {
    if (!muscleGroup || !exerciseName) return null
    const category = mapToRestCategory(muscleGroup, exerciseName)
    const goal = mapToTrainingGoal(objective ?? 'general')
    return calcRestRecommendation(category, goal, rpe, rir)
  }, [muscleGroup, exerciseName, rpe, rir, objective])

  // Mantiene fresca en el store la recomendación del modo Auto (F96, D2).
  useEffect(() => {
    if (recommendation) setAutoRestSeconds(recommendation.recommendedSeconds)
  }, [recommendation, setAutoRestSeconds])

  const isAuto = restMode === 'auto'

  // Cambiar de modo refresca el preview; si hay descanso en curso, lo reinicia con el nuevo valor.
  const selectMode = (mode: 'auto' | number) => {
    setRestMode(mode)
    if (isResting) startRest()
  }

  // Al volver a primer plano se reconcilia contra el deadline, no contra ticks perdidos.
  // Web: visibilitychange. Nativo: appStateChange/resume con limpieza (patrón useHealthSync).
  useEffect(() => {
    const reconcileNow = () => {
      useActiveWorkoutStore.getState().reconcileRest()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') reconcileNow()
    }
    document.addEventListener('visibilitychange', onVisibility)
    const nativeHandlers = Capacitor.isNativePlatform()
      ? [
          App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) reconcileNow()
          }),
          App.addListener('resume', reconcileNow),
        ]
      : []
    reconcileNow()
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      nativeHandlers.forEach((handler) => void handler.then((l) => l.remove()))
    }
  }, [])

  // Avisa una única vez por segundo en los últimos 3s (guard: no repetir el mismo valor).
  useEffect(() => {
    if (!isResting) {
      lastWarnedRef.current = -1
      return
    }
    if (restRemaining > 0 && restRemaining <= 3 && restRemaining !== lastWarnedRef.current) {
      lastWarnedRef.current = restRemaining
      if (settings.restSound) playRestWarningSound()
    }
  }, [isResting, restRemaining, settings.restSound])

  // Deadline del descanso en curso: distingue el cierre natural (venció) de una
  // parada manual (pausa/reinicio) al salir del estado de descanso.
  const lastEndsAtRef = useRef<number | null>(null)
  useEffect(() => {
    if (isResting) lastEndsAtRef.current = restEndsAt
  }, [isResting, restEndsAt])

  // Al vencer el descanso de forma natural: campana, vibración y mensaje de retorno.
  // El dedupe evita repetir la alerta si el SO ya entregó la notificación (nativo).
  const wasRestingRef = useRef(false)
  useEffect(() => {
    const wasResting = wasRestingRef.current
    wasRestingRef.current = isResting
    if (isResting) {
      setJustFinished(false)
      return
    }
    if (!wasResting) return
    const deadline = lastEndsAtRef.current
    lastEndsAtRef.current = null
    // Parada manual (pausa/reinicio): no es un fin natural, no alerta.
    if (deadline === null || Date.now() < deadline) return
    setJustFinished(true)
    if (suppressInAppAlert()) return
    if (settings.restSound) playBoxingBellSound()
    haptics([200, 100, 200], { enabled: settings.restVibrate })
  }, [isResting, settings.restSound, settings.restVibrate, suppressInAppAlert])

  const almostDone = isResting && restRemaining > 0 && restRemaining <= 3
  // En idle el número grande es 00:00; la duración configurada vive en el label chico.
  const countdown = isResting ? restRemaining : 0
  const progress = isResting
    ? Math.min(100, Math.max(0, ((restSeconds - restRemaining) / Math.max(1, restSeconds)) * 100))
    : 0
  const presetLabel = (seconds: number) =>
    seconds >= 60
      ? t('rest.minutesShort', { m: Math.round(seconds / 60) })
      : t('rest.secondsShort', { s: seconds })
  const recommendationText = recommendation
    ? t('rest.recommended', { min: recommendation.minSeconds, max: recommendation.maxSeconds })
    : t('rest.autoHint')
  const recommendationReason = recommendation
    ? recommendation.reason === 'rest.reason_compound_fuerza'
      ? t('rest.reason_compound_fuerza')
      : recommendation.reason === 'rest.reason_compound_hipertrofia'
        ? t('rest.reason_compound_hipertrofia')
        : recommendation.reason === 'rest.reason_isolation'
          ? t('rest.reason_isolation')
          : t('rest.reason_general')
    : null

  return (
    <>
      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom)+4.25rem)] z-40 px-4">
        <div className="mx-auto max-w-lg border-t border-border/40 bg-bg/95 backdrop-blur-md">
          <div className="flex items-center gap-2 py-2">
            <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-muted">
              {t('workout.descanso')}
            </span>
            <span
              data-testid="timer-display"
              className={`font-display text-xl tabular-nums ${
                almostDone ? 'text-danger' : isResting ? 'text-fg' : 'text-muted'
              }`}
            >
              {formatDuration(countdown, settings.timerFormat)}
            </span>
            <span className="text-[9px] text-muted">
              {isAuto ? t('rest.auto') : presetLabel(restSeconds)}
            </span>
            <div className="ml-auto flex items-center gap-1">
              {!isResting ? (
                <button
                  type="button"
                  onClick={() => startRest()}
                  aria-label={t('workout.iniciarDescanso')}
                  className="flex size-9 items-center justify-center rounded-full bg-cta/10 text-gold"
                >
                  <Play className="size-4" fill="currentColor" aria-hidden />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={stopRest}
                    aria-label={t('workout.pausar')}
                    className="flex size-9 items-center justify-center rounded-full border border-border text-muted"
                  >
                    <Pause className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopRest()
                      startRest()
                    }}
                    aria-label={t('workout.reiniciarDescanso')}
                    className="flex size-9 items-center justify-center rounded-full border border-border text-muted"
                  >
                    <RotateCcw className="size-4" aria-hidden />
                  </button>
                </>
              )}
              <button
                type="button"
                data-testid="rest-options"
                onClick={() => setSheetOpen(true)}
                aria-label={t('rest.options')}
                className="flex size-9 items-center justify-center rounded-full border border-border text-muted"
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </button>
            </div>
          </div>
          <div className="h-0.5 bg-border/40">
            <div
              className={`h-0.5 transition-[width] duration-1000 ease-linear motion-reduce:transition-none ${
                almostDone ? 'bg-danger' : 'bg-gradient-to-r from-gold to-gold-bright'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {justFinished && (
            <p className="pb-1 text-[9px] font-medium text-gold" aria-live="polite">
              {t('workout.vuelveSiguiente')}
            </p>
          )}
        </div>
      </div>

      {sheetOpen && (
        <BottomSheet
          title={t('workout.descanso')}
          subtitle={t('rest.sheetSubtitle')}
          onClose={() => setSheetOpen(false)}
        >
          <button
            type="button"
            data-testid="rest-mode-auto"
            onClick={() => selectMode('auto')}
            aria-pressed={isAuto}
            aria-label={t('rest.autoAria')}
            className={`mt-2 flex w-full items-center gap-3 border-y border-border/40 py-2 text-left ${
              isAuto ? 'text-gold-bright' : 'text-fg'
            }`}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{t('rest.auto')}</span>
              <span className="block text-[10px] text-muted">
                {recommendationText}
                {recommendationReason ? ` · ${recommendationReason}` : ''}
              </span>
            </span>
            {isAuto && <span className="text-xs text-gold">✓</span>}
          </button>

          <p className="mt-3 text-[8px] font-semibold uppercase tracking-[0.18em] text-muted">
            {t('rest.presets')}
          </p>
          <div className="mt-1 flex gap-1.5">
            {PRESETS.map((seconds) => (
              <button
                key={seconds}
                type="button"
                data-testid="rest-preset"
                data-preset={seconds}
                onClick={() => selectMode(seconds)}
                aria-pressed={restMode === seconds}
                className={`flex min-h-10 flex-1 items-center justify-center rounded-full border text-[10px] font-semibold ${
                  restMode === seconds
                    ? 'border-cta/55 bg-cta/10 text-gold-bright'
                    : 'border-border text-muted'
                }`}
              >
                {presetLabel(seconds)}
              </button>
            ))}
          </div>

          <p className="mt-3 text-[8px] font-semibold uppercase tracking-[0.18em] text-muted">
            {t('rest.alerts')}
          </p>
          <div className="mt-1 border-t border-border/40">
            <div className="flex min-h-11 items-center justify-between text-sm">
              <span>{t('rest.sound')}</span>
              <button
                type="button"
                role="switch"
                aria-checked={settings.restSound}
                aria-label={t('rest.sound')}
                onClick={() => void update({ restSound: !settings.restSound })}
                className={`relative h-6 w-10 rounded-full ${settings.restSound ? 'bg-gold' : 'bg-fg/15'}`}
              >
                <span
                  className={`absolute top-0.5 size-5 rounded-full bg-bg transition-transform ${
                    settings.restSound ? 'translate-x-[1.15rem]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="flex min-h-11 items-center justify-between border-t border-border/40 text-sm">
              <span>{t('rest.vibrate')}</span>
              <button
                type="button"
                role="switch"
                aria-checked={settings.restVibrate}
                aria-label={t('rest.vibrate')}
                onClick={() => void update({ restVibrate: !settings.restVibrate })}
                className={`relative h-6 w-10 rounded-full ${settings.restVibrate ? 'bg-gold' : 'bg-fg/15'}`}
              >
                <span
                  className={`absolute top-0.5 size-5 rounded-full bg-bg transition-transform ${
                    settings.restVibrate ? 'translate-x-[1.15rem]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {(restAlertWarning !== null || isResting) && (
            <div className="mt-2">
              <RestAlertNotice
                warning={restAlertWarning}
                isNative={isNativePlatform}
                onDismiss={dismissWarning}
              />
            </div>
          )}

          <div className="mt-3 flex gap-2">
            {isResting && (
              <Button
                variant="outline"
                size="md"
                className="flex-1 text-danger hover:border-danger"
                onClick={() => {
                  stopRest()
                  setSheetOpen(false)
                }}
              >
                {t('rest.stop')}
              </Button>
            )}
            <Button size="md" className="flex-1" onClick={() => setSheetOpen(false)}>
              {t('workout.listo')}
            </Button>
          </div>
        </BottomSheet>
      )}
    </>
  )
}
