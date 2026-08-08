// Utilidades de sesiones de entrenamiento: fechas, duración, volumen semanal y formato de cronómetro.
import type { Workout } from './types'

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

// Volumen total de los últimos 7 días a partir de hoy.
export const weeklyVolume = (
  workouts: { localDate?: string; startedAt: string; totalVolume: number }[],
  now: Date = new Date()
): number => {
  const weekAgo = new Date(now.getTime() - 7 * 86400000)
  return workouts
    .filter((w) => workoutDate(w) >= weekAgo)
    .reduce((acc, w) => acc + w.totalVolume, 0)
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
