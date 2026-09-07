// Motor puro del contador de pasos (F84a): distancia, calorías, racha diaria,
// comparativa semanal y heatmap mensual. Sin React ni Dexie: la UI y los
// repositorios consumen estas funciones.
import type { DailyStepsEntry } from './types'
import { addLocalDays, toLocalDateStr } from './dates'

// Meta diaria por defecto (key de meta `stepsGoal`; decisión de diseño F84a).
export const DEFAULT_STEPS_GOAL = 10_000

// Distancia en km a partir de pasos y zancada (pasos × zancada cm → m → km).
export const calculateDistance = (steps: number, strideLengthCm: number): number =>
  (steps * strideLengthCm) / 100 / 1000

// Calorías aproximadas: 0,04 kcal por paso (consistente con F84e). El peso queda
// en la firma para compatibilidad futura; la fórmula actual no lo usa.
export const calculateCalories = (steps: number, _weightKg: number): number => steps * 0.04

// Zancada por defecto: 41,5% de la estatura del perfil (decisión F84a); sin
// estatura → 70 cm.
export const defaultStrideFromHeight = (heightCm: number | null | undefined): number =>
  heightCm && heightCm > 0 ? heightCm * 0.415 : 70

// Días consecutivos cumpliendo la meta (steps >= goal) terminando en `today`.
// Si hoy aún no tiene registro, la racha puede seguir viva desde ayer; si hoy
// está registrado pero por debajo de la meta, la racha se considera rota.
export const getStreak = (
  entries: DailyStepsEntry[],
  goal: number,
  today: string = toLocalDateStr(),
): number => {
  if (goal <= 0) return 0
  const stepsByDate = new Map(entries.map((e) => [e.localDate, e.steps]))
  const meets = (date: string): boolean => (stepsByDate.get(date) ?? 0) >= goal
  if (stepsByDate.has(today) && !meets(today)) return 0
  let streak = 0
  for (
    let date = meets(today) ? today : addLocalDays(today, -1);
    meets(date);
    date = addLocalDays(date, -1)
  ) {
    streak++
  }
  return streak
}

// Delta % del total de pasos entre dos semanas (redondeado); sin datos previos,
// cualquier avance cuenta como +100% (mismo criterio que weeklySummary).
export const getWeeklyComparison = (week1: DailyStepsEntry[], week2: DailyStepsEntry[]): number => {
  const total = (entries: DailyStepsEntry[]): number => entries.reduce((sum, e) => sum + e.steps, 0)
  const current = total(week1)
  const previous = total(week2)
  if (previous <= 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

// Intensidad diaria del heatmap mensual según el % de la meta cumplido.
export type StepHeatLevel = 0 | 1 | 2 | 3 | 4

export const getMonthlyHeatmap = (
  monthData: DailyStepsEntry[],
  goal: number,
): Record<string, StepHeatLevel> => {
  const base = goal > 0 ? goal : 1
  const levelFor = (steps: number): StepHeatLevel => {
    if (steps <= 0) return 0
    const ratio = steps / base
    if (ratio >= 1) return 4
    if (ratio >= 0.5) return 3
    if (ratio >= 0.25) return 2
    return 1
  }
  const heatmap: Record<string, StepHeatLevel> = {}
  for (const e of monthData) heatmap[e.localDate] = levelFor(e.steps)
  return heatmap
}