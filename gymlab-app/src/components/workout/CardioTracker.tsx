// CardioTracker: UI en tiempo real para tracking de cardio con GPS o acelerómetro.
// Muestra duración, distancia, ritmo, calorías y pasos según el modo activo.
// El usuario elige modo GPS (exterior), acelerómetro (cinta/gimnasio) o manual.

import { useState } from 'react'
import { Square, MapPin, PenLine, Timer, Flame, Footprints, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCardioTracking, type CardioMode } from '@/hooks/useCardioTracking'

interface CardioTrackerProps {
  exerciseMet: number
  weightKg: number
  strideLengthCm?: number
  onFinish: (data: { durationSeconds: number; distanceMeters: number }) => void
}

const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

const formatPace = (pace: number | null): string => {
  if (pace == null || pace <= 0) return '--:--'
  const m = Math.floor(pace)
  const s = Math.round((pace - m) * 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export const CardioTracker = ({ exerciseMet, weightKg, strideLengthCm, onFinish }: CardioTrackerProps) => {
  const { t } = useTranslation()
  const tracker = useCardioTracking({ exerciseMet, weightKg, strideLengthCm })
  const [mode, setMode] = useState<CardioMode | null>(null)

  const handleStart = (selectedMode: CardioMode) => {
    setMode(selectedMode)
    tracker.start(selectedMode)
  }

  const handleStop = () => {
    const data = tracker.stop()
    onFinish({ durationSeconds: data.durationSeconds, distanceMeters: data.distanceMeters })
  }

  const handleFinishManual = () => {
    // Para modo manual, el SetRow tradicional maneja los inputs.
    onFinish({ durationSeconds: 0, distanceMeters: 0 })
  }

  // Pantalla de selección de modo.
  if (!tracker.isTracking && !mode) {
    return (
      <div className="rounded-2xl border border-border bg-bg-elevated p-4">
        <p className="mb-3 text-center text-sm font-medium text-fg">
          {t('workout.cardioSeleccionarModo')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {tracker.isGpsAvailable && (
            <button
              type="button"
              onClick={() => handleStart('gps')}
              className="flex min-h-[56px] flex-col items-center gap-1 rounded-xl border border-border bg-bg px-2 py-3 text-center transition-colors hover:border-accent hover:bg-accent/5"
            >
              <MapPin className="size-5 text-accent" />
              <span className="text-xs font-medium text-fg">{t('workout.modoGps')}</span>
              <span className="text-[0.6rem] text-muted">{t('workout.modoGpsDesc')}</span>
            </button>
          )}
          {tracker.isPedometerAvailable && (
            <button
              type="button"
              onClick={() => handleStart('pedometer')}
              className="flex min-h-[56px] flex-col items-center gap-1 rounded-xl border border-border bg-bg px-2 py-3 text-center transition-colors hover:border-accent hover:bg-accent/5"
            >
              <Footprints className="size-5 text-accent" />
              <span className="text-xs font-medium text-fg">{t('workout.modoPedometro')}</span>
              <span className="text-[0.6rem] text-muted">{t('workout.modoPedometroDesc')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleFinishManual}
            className="flex min-h-[56px] flex-col items-center gap-1 rounded-xl border border-border bg-bg px-2 py-3 text-center transition-colors hover:border-accent hover:bg-accent/5"
          >
            <PenLine className="size-5 text-accent" />
            <span className="text-xs font-medium text-fg">{t('workout.modoManual')}</span>
            <span className="text-[0.6rem] text-muted">{t('workout.modoManualDesc')}</span>
          </button>
        </div>
      </div>
    )
  }

  // Pantalla de tracking activo.
  return (
    <div className="rounded-2xl border border-border bg-bg-elevated p-4">
      {/* Header con modo activo */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {tracker.mode === 'gps' && <MapPin className="size-4 text-accent" />}
          {tracker.mode === 'pedometer' && <Footprints className="size-4 text-accent" />}
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            {tracker.mode === 'gps' ? 'GPS' : tracker.mode === 'pedometer' ? t('workout.pedometro') : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          <span className="text-xs font-medium text-success">{t('workout.trackingActivo')}</span>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {/* Duración */}
        <div className="rounded-xl bg-bg p-3 text-center">
          <Timer className="mx-auto mb-1 size-4 text-muted" />
          <p className="font-display text-2xl font-bold text-fg">{formatTime(tracker.durationSeconds)}</p>
          <p className="text-[0.6rem] text-muted">{t('workout.duracionSerie')}</p>
        </div>
        {/* Distancia */}
        <div className="rounded-xl bg-bg p-3 text-center">
          <MapPin className="mx-auto mb-1 size-4 text-muted" />
          <p className="font-display text-2xl font-bold text-fg">
            {tracker.distanceMeters >= 1000
              ? `${(tracker.distanceMeters / 1000).toFixed(2)} km`
              : `${Math.round(tracker.distanceMeters)} m`}
          </p>
          <p className="text-[0.6rem] text-muted">{t('workout.distanciaSerie')}</p>
        </div>
        {/* Ritmo */}
        <div className="rounded-xl bg-bg p-3 text-center">
          <Zap className="mx-auto mb-1 size-4 text-muted" />
          <p className="font-display text-2xl font-bold text-fg">{formatPace(tracker.paceMinPerKm)}</p>
          <p className="text-[0.6rem] text-muted">min/km</p>
        </div>
        {/* Calorías */}
        <div className="rounded-xl bg-bg p-3 text-center">
          <Flame className="mx-auto mb-1 size-4 text-muted" />
          <p className="font-display text-2xl font-bold text-fg">{tracker.calories}</p>
          <p className="text-[0.6rem] text-muted">kcal</p>
        </div>
      </div>

      {/* Pasos (solo pedómetro) */}
      {tracker.mode === 'pedometer' && tracker.stepCount > 0 && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-bg p-2">
          <Footprints className="size-4 text-accent" />
          <span className="text-sm font-medium text-fg">
            {tracker.stepCount.toLocaleString()} {t('workout.pasos')}
          </span>
        </div>
      )}

      {/* Botón detener */}
      <button
        type="button"
        onClick={handleStop}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-danger/10 text-sm font-medium text-danger transition-colors hover:bg-danger/20"
      >
        <Square className="size-4" />
        {t('workout.detenerCardio')}
      </button>
    </div>
  )
}
