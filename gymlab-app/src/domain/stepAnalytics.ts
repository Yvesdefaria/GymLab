// Analítica pura del dashboard de pasos (rediseño 2026-10-23): tiempo caminando,
// validación de meta/alta manual, meses con datos, navegación entre meses y series
// de mes/año. Sin React, sin Dexie y sin i18n: las etiquetas las pone la UI.
import type { DailyStepsEntry } from './types'
import { toLocalDateStr } from './dates'

// Ritmo de caminata usado para estimar el tiempo activo. Es una aproximación,
// no una medición: la UI siempre la muestra como «estimado».
export const STEPS_PER_MINUTE = 100

// Límites de la meta editable y del alta manual.
export const STEP_GOAL_MIN = 1_000
export const STEP_GOAL_MAX = 50_000
export const MANUAL_STEPS_MAX = 100_000

export type StepGoalError = 'empty' | 'min' | 'max' | null
export type ManualStepsError = 'empty' | 'max' | null

export const estimateWalkingMinutes = (steps: number): number => {
  if (!Number.isFinite(steps) || steps <= 0) return 0
  return Math.round(steps / STEPS_PER_MINUTE)
}

// Devuelve el valor y el error de validación por separado: la UI puede mostrar
// el número parseado aunque esté fuera de rango.
export const parseStepGoal = (raw: string): { value: number | null; error: StepGoalError } => {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return { value: null, error: 'empty' }
  const value = Number(digits)
  if (!Number.isInteger(value) || !Number.isFinite(value)) {
    return { value: null, error: 'empty' }
  }
  if (value < STEP_GOAL_MIN) return { value, error: 'min' }
  if (value > STEP_GOAL_MAX) return { value, error: 'max' }
  return { value, error: null }
}

// El alta manual reemplaza el total del día; 0 es válido para limpiarlo.
export const parseManualSteps = (
  raw: string,
): { value: number | null; error: ManualStepsError } => {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return { value: null, error: 'empty' }
  const value = Number(digits)
  if (!Number.isInteger(value) || !Number.isFinite(value) || value < 0) {
    return { value: null, error: 'empty' }
  }
  if (value > MANUAL_STEPS_MAX) return { value, error: 'max' }
  return { value, error: null }
}

export const currentMonthKey = (today: string = toLocalDateStr()): string =>
  today.slice(0, 7)

export const getMonthEntries = (
  entries: DailyStepsEntry[],
  monthKey: string,
): DailyStepsEntry[] => entries.filter((e) => e.localDate.startsWith(monthKey))

export const getMonthTotal = (entries: DailyStepsEntry[]): number =>
  entries.reduce((sum, e) => sum + e.steps, 0)

export const getDaysWithData = (entries: DailyStepsEntry[]): number =>
  entries.filter((e) => e.steps > 0).length

// Lista ascendente de meses navegables: los que tienen datos (> 0) más el mes
// vigente, que siempre está disponible aunque todavía no tenga pasos.
export const getMonthsWithData = (
  entries: DailyStepsEntry[],
  currentMonth: string,
): string[] => {
  const months = new Set<string>([currentMonth])
  for (const e of entries) {
    if (e.steps > 0) months.add(e.localDate.slice(0, 7))
  }
  return [...months].sort()
}

// -1 = mes anterior con datos; +1 = siguiente mes con datos. null = no hay.
export const getAdjacentMonthKey = (
  months: string[],
  current: string,
  direction: -1 | 1,
): string | null => {
  const index = months.indexOf(current)
  if (index < 0) return null
  return months[index + direction] ?? null
}

const daysInMonth = (monthKey: string): number => {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month, 0).getDate()
}

export type MonthPoint = { date: string; day: number; steps: number }

// Serie diaria del mes: en el mes vigente corta en hoy para no dibujar días
// futuros como si fueran cero; en meses pasados incluye el mes completo. Un mes
// futuro devuelve [] (la navegación no debería permitirlo).
export const buildMonthSeries = (
  entries: DailyStepsEntry[],
  monthKey: string,
  today: string = toLocalDateStr(),
): MonthPoint[] => {
  const current = currentMonthKey(today)
  if (monthKey > current) return []
  const lastDay =
    monthKey === current ? Number(today.slice(8, 10)) : daysInMonth(monthKey)
  const stepsByDate = new Map(entries.map((e) => [e.localDate, e.steps]))

  return Array.from({ length: lastDay }, (_, i) => {
    const day = i + 1
    const date = `${monthKey}-${String(day).padStart(2, '0')}`
    return { date, day, steps: stepsByDate.get(date) ?? 0 }
  })
}

export type YearPoint = {
  month: number
  key: string
  steps: number
  isCurrent: boolean
  isFuture: boolean
}

// Serie anual (enero–diciembre del año calendario): agrega el total mensual de
// los días con datos y marca el mes vigente y los futuros para que la UI no los
// pinte como meses cerrados.
export const buildYearSeries = (
  entries: DailyStepsEntry[],
  year: number,
  today: string = toLocalDateStr(),
): YearPoint[] => {
  const current = currentMonthKey(today)
  const totals = new Map<string, number>()
  for (const e of entries) {
    if (e.steps <= 0) continue
    const key = e.localDate.slice(0, 7)
    totals.set(key, (totals.get(key) ?? 0) + e.steps)
  }

  return Array.from({ length: 12 }, (_, month) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`
    return {
      month,
      key,
      steps: totals.get(key) ?? 0,
      isCurrent: key === current,
      isFuture: key > current,
    }
  })
}
