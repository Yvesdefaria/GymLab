// Utilidades de sesiones de entrenamiento: fechas, duración, volumen semanal y formato de cronómetro.
import type { Workout } from './types'
import { localDateOf, toLocalDateStr, weekStartKey } from './dates'
import { volumeOf, type VolumeByWorkout } from './volume'

// Fecha del entreno como Date, usando localDate a mediodía local para evitar saltos de día por zona horaria.
export const workoutDate = (w: { localDate?: string; startedAt: string }): Date => {
  return w.localDate ? new Date(w.localDate + 'T12:00:00') : new Date(w.startedAt)
}

// Duración en minutos de una sesión finalizada (mínimo 1 min; null si aún está en curso).
export const workoutDurationMin = (
  w: Pick<Workout, 'startedAt' | 'finishedAt'>
): number | null => {
  if (!w.finishedAt) return null
  return Math.max(1, Math.round((new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60000))
}

// Volumen total de la semana calendario actual (lunes–domingo), igual que
// Estadísticas/Insights/WeeklySummary (F139.15).
export const weeklyVolume = (
  workouts: { id: number; localDate?: string; startedAt: string }[],
  volumes: VolumeByWorkout,
  now: Date = new Date()
): number => {
  const weekKey = weekStartKey(toLocalDateStr(now))
  return workouts
    .filter((w) => weekStartKey(localDateOf(w)) === weekKey)
    .reduce((acc, w) => acc + volumeOf(w, volumes), 0)
}

// Formatea segundos como mm:ss u h:mm:ss (cronómetro de la sesión activa).
export const formatElapsedClock = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
