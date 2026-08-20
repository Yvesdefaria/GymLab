// Hook unificado de tracking de cardio: GPS (Geolocation API) o acelerómetro/pedómetro (DeviceMotion API).
// Cuando el usuario inicia una sesión de cardio, el hook gestiona la captura automática de
// distancia, duración y ritmo, calculando calorías con los METs del ejercicio.

import { useCallback, useEffect, useRef, useState } from 'react'
import { calcCalories, calcPace, calcSpeed } from '@/domain/cardio'

export type CardioMode = 'gps' | 'pedometer' | 'manual'

export interface CardioTrackingState {
  isTracking: boolean
  mode: CardioMode | null
  durationSeconds: number
  distanceMeters: number
  paceMinPerKm: number | null
  speedKmh: number | null
  calories: number
  stepCount: number
  accuracy: 'high' | 'medium' | 'low' | null
}

interface UseCardioTrackingOptions {
  exerciseMet: number
  weightKg: number
  strideLengthCm?: number // longitud de zancada estimada (default 70cm)
}

// Detecta si Geolocation está disponible.
const hasGeolocation = (): boolean => 'geolocation' in navigator

// Detecta si DeviceMotion está disponible.
const hasDeviceMotion = (): boolean => 'DeviceMotionEvent' in window

// Estima longitud de zancada a partir de estatura (si está en profile) o usa default.
const DEFAULT_STRIDE_CM = 70

export const useCardioTracking = ({
  exerciseMet,
  weightKg,
  strideLengthCm,
}: UseCardioTrackingOptions) => {
  const [state, setState] = useState<CardioTrackingState>({
    isTracking: false,
    mode: null,
    durationSeconds: 0,
    distanceMeters: 0,
    paceMinPerKm: null,
    speedKmh: null,
    calories: 0,
    stepCount: 0,
    accuracy: null,
  })

  const watchIdRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const distanceRef = useRef(0)
  const stepsRef = useRef(0)
  const lastAccelRef = useRef<{ x: number; y: number; z: number } | null>(null)
  const lastStepTimeRef = useRef(0)
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null)

  const stride = strideLengthCm ?? DEFAULT_STRIDE_CM

  // Calcula magnitud de aceleración y detecta paso.
  const handleMotion = useCallback(
    (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity
      if (!acc || acc.x == null || acc.y == null || acc.z == null) return

      const now = Date.now()
      const prev = lastAccelRef.current

      if (prev) {
        const dx = acc.x - prev.x
        const dy = acc.y - prev.y
        const dz = acc.z - prev.z
        const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz)

        // Umbral para detectar un paso (ajustado empíricamente).
        const STEP_THRESHOLD = 12
        const MIN_STEP_INTERVAL_MS = 250

        if (magnitude > STEP_THRESHOLD && now - lastStepTimeRef.current > MIN_STEP_INTERVAL_MS) {
          stepsRef.current += 1
          lastStepTimeRef.current = now

          // Distancia acumulada = pasos × stride.
          distanceRef.current = (stepsRef.current * stride) / 100
        }
      }

      lastAccelRef.current = { x: acc.x, y: acc.y, z: acc.z }
    },
    [stride],
  )

  // Haversine: calcula distancia entre dos puntos GPS en metros.
  const calcDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  // Callback GPS: acumula distancia con filtro de ruido.
  const handlePosition = useCallback((pos: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = pos.coords
    const prev = lastPositionRef.current

    if (prev) {
      const delta = calcDistanceMeters(prev.lat, prev.lng, latitude, longitude)
      // Filtrar lecturas con baja precisión o saltos enormes (>50m entre muestras).
      if (accuracy < 50 && delta < 50 && delta > 0.5) {
        distanceRef.current += delta
      }
    }

    lastPositionRef.current = { lat: latitude, lng: longitude }
  }, [])

  // Actualiza el state con los valores acumulados.
  const tickUpdate = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
    const dist = distanceRef.current
    const steps = stepsRef.current

    setState((prev) => ({
      ...prev,
      durationSeconds: elapsed,
      distanceMeters: Math.round(dist * 10) / 10,
      paceMinPerKm: dist > 0 ? calcPace(elapsed, dist) : null,
      speedKmh: dist > 0 ? calcSpeed(elapsed, dist) : null,
      calories: calcCalories({
        durationSeconds: elapsed,
        distanceMeters: dist > 0 ? dist : undefined,
        weightKg,
        metValue: exerciseMet,
      }),
      stepCount: steps,
    }))
  }, [exerciseMet, weightKg])

  // Inicia tracking.
  const start = useCallback(
    (mode: CardioMode) => {
      // Limpia cualquier tracking previo.
      stop()

      startTimeRef.current = Date.now()
      distanceRef.current = 0
      stepsRef.current = 0
      lastAccelRef.current = null
      lastStepTimeRef.current = 0
      lastPositionRef.current = null

      setState((prev) => ({
        ...prev,
        isTracking: true,
        mode,
        accuracy: mode === 'gps' ? 'high' : mode === 'pedometer' ? 'medium' : 'low',
      }))

      // Timer de actualización cada segundo.
      intervalRef.current = setInterval(tickUpdate, 1000)

      if (mode === 'gps' && hasGeolocation()) {
        navigator.geolocation.watchPosition(handlePosition, () => {}, {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000,
        })
      } else if (mode === 'pedometer' && hasDeviceMotion()) {
        window.addEventListener('devicemotion', handleMotion)
      }
    },
    [tickUpdate, handlePosition, handleMotion],
  )

  // Detiene tracking y retorna datos finales.
  const stop = useCallback((): { durationSeconds: number; distanceMeters: number; steps: number } => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    window.removeEventListener('devicemotion', handleMotion)

    const finalData = {
      durationSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
      distanceMeters: distanceRef.current,
      steps: stepsRef.current,
    }

    setState((prev) => ({ ...prev, isTracking: false }))
    return finalData
  }, [handleMotion])

  // Limpieza al desmontar.
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      window.removeEventListener('devicemotion', handleMotion)
    }
  }, [handleMotion])

  return {
    ...state,
    start,
    stop,
    isGpsAvailable: hasGeolocation(),
    isPedometerAvailable: hasDeviceMotion(),
  }
}
