// Estadísticas agregadas de entrenamiento: frecuencia semanal, duración, volumen por músculo, velas OHLC y objetivos.
import type { Exercise, MuscleGroup, Workout, WorkoutSet } from './types'
import { toLocalDateStr } from './dates'
import { calcStreak } from './streak'
import { calcSetVolume } from './volume'
import { workoutDurationMin } from './workouts'

export interface FrequencyPoint {
  week: string
  count: number
}

export interface MuscleVolume {
  muscle: MuscleGroup
  volume: number
}

export interface LoadRangePoint {
  date: string
  open: number
  close: number
  high: number
  low: number
}

export interface VolumeRangePoint {
  week: string
  open: number
  close: number
  high: number
  low: number
}

// Fecha local del entreno, priorizando el campo localDate sobre el timestamp de inicio.
const localDateOf = (w: { localDate?: string; startedAt: string }): string =>
  w.localDate ?? toLocalDateStr(new Date(w.startedAt))

/** Lunes como inicio de semana para agrupar entrenos por semana calendario. */
export const weekStartKey = (dateStr: string): string => {
  const d = new Date(dateStr + 'T12:00:00')
  const mondayOffset = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - mondayOffset)
  return toLocalDateStr(d)
}

// Nº de entrenos por semana calendario (lunes como inicio), en orden cronológico.
export const weeklyFrequency = (workouts: Workout[]): FrequencyPoint[] => {
  const byWeek = new Map<string, number>()
  const sorted = [...workouts].sort((a, b) => a.startedAt.localeCompare(b.startedAt))
  for (const w of sorted) {
    const key = weekStartKey(localDateOf(w))
    byWeek.set(key, (byWeek.get(key) ?? 0) + 1)
  }
  return Array.from(byWeek, ([week, count]) => ({ week, count }))
}

// Duración media en minutos de las sesiones finalizadas (null si no hay ninguna terminada).
export const avgSessionDurationMin = (workouts: Workout[]): number | null => {
  const finished = workouts.filter((w) => w.finishedAt)
  if (finished.length === 0) return null
  const total = finished.reduce((acc, w) => acc + (workoutDurationMin(w) ?? 0), 0)
  return Math.round(total / finished.length)
}

// Días distintos entrenados dentro de la ventana de días recientes.
export const trainedDaysInLast = (
  workouts: Workout[],
  days: number,
  now: Date = new Date()
): number => {
  const cutoff = toLocalDateStr(new Date(now.getTime() - days * 86_400_000))
  const dates = new Set(workouts.map(localDateOf))
  let count = 0
  for (const d of dates) if (d >= cutoff) count++
  return count
}

// Racha máxima de días consecutivos entrenando, reutilizando el cálculo de streak.
export const maxStreakDays = (workouts: Workout[]): number => {
  const dates = workouts.map(localDateOf)
  return calcStreak(dates).longestStreak
}

/** Volumen total acumulado por grupo muscular a partir de las series completadas. */
export const volumeByMuscleGroup = (
  sets: WorkoutSet[],
  workoutsById: ReadonlyMap<number, Workout>,
  exerciseById: ReadonlyMap<number, Exercise>
): MuscleVolume[] => {
  const totals = new Map<MuscleGroup, number>()
  for (const set of sets) {
    if (!set.completed || set.weightKg <= 0 || set.reps <= 0) continue
    if (!workoutsById.has(set.workoutId)) continue
    const exercise = exerciseById.get(set.exerciseId)
    if (!exercise) continue
    totals.set(exercise.muscleGroup, (totals.get(exercise.muscleGroup) ?? 0) + calcSetVolume(set))
  }
  return Array.from(totals, ([muscle, volume]) => ({ muscle, volume })).sort(
    (a, b) => b.volume - a.volume
  )
}

/** Rango de cargas por sesión de un ejercicio: vela OHLC con el peso de las series (sin calentamientos). */
export const buildLoadRangeSeries = (
  sets: WorkoutSet[],
  workoutsById: ReadonlyMap<number, Workout>,
  exerciseId: number
): LoadRangePoint[] => {
  const byWorkout = new Map<number, WorkoutSet[]>()
  for (const set of sets) {
    if (!set.completed || set.weightKg <= 0 || set.isWarmup || set.exerciseId !== exerciseId) {
      continue
    }
    const list = byWorkout.get(set.workoutId) ?? []
    list.push(set)
    byWorkout.set(set.workoutId, list)
  }

  const points: LoadRangePoint[] = []
  for (const [workoutId, workoutSets] of byWorkout) {
    const workout = workoutsById.get(workoutId)
    if (!workout) continue
    const sorted = [...workoutSets].sort((a, b) => a.setNumber - b.setNumber)
    const weights = sorted.map((s) => s.weightKg)
    points.push({
      date: localDateOf(workout),
      open: weights[0],
      close: weights[weights.length - 1],
      high: Math.max(...weights),
      low: Math.min(...weights),
    })
  }
  return points.sort((a, b) => a.date.localeCompare(b.date))
}

/** Rango de volumen por semana: vela OHLC con el volumen de cada día entrenado. */
export const buildVolumeRangeSeries = (workouts: Workout[]): VolumeRangePoint[] => {
  const byWeek = new Map<string, { date: string; volume: number }[]>()
  for (const w of workouts) {
    const date = localDateOf(w)
    const key = weekStartKey(date)
    const list = byWeek.get(key) ?? []
    list.push({ date, volume: w.totalVolume })
    byWeek.set(key, list)
  }

  const points: VolumeRangePoint[] = []
  for (const [week, days] of byWeek) {
    days.sort((a, b) => a.date.localeCompare(b.date))
    const volumes = days.map((d) => d.volume)
    points.push({
      week,
      open: volumes[0],
      close: volumes[volumes.length - 1],
      high: Math.max(...volumes),
      low: Math.min(...volumes),
    })
  }
  return points.sort((a, b) => a.week.localeCompare(b.week))
}

/** Progreso (0-1) del objetivo semanal de entrenos según los entrenos de la semana actual. */
export const weeklyGoalProgress = (
  workouts: Workout[],
  weeklyGoal: number,
  now: Date = new Date()
): number => {
  if (weeklyGoal <= 0) return 0
  const weekKey = weekStartKey(toLocalDateStr(now))
  let count = 0
  for (const w of workouts) {
    if (weekStartKey(localDateOf(w)) === weekKey) count++
  }
  return Math.min(1, count / weeklyGoal)
}

/** Número de entrenos de la semana actual (para mostrar el objetivo como x/y). */
export const workoutsInCurrentWeek = (workouts: Workout[], now: Date = new Date()): number => {
  const weekKey = weekStartKey(toLocalDateStr(now))
  return workouts.filter((w) => weekStartKey(localDateOf(w)) === weekKey).length
}
