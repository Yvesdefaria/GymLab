// Hook del contador de pasos: expone hoy, semana y mes actuales, racha, heatmap,
// logros y meta diaria, más las operaciones registrar pasos y ajustar el objetivo.
// F84f consume este hook; aquí no hay lógica de presentación.
import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useLiveList } from './useLiveList'
import { stepRepo } from '@/data/repositories'
import { track } from '@/lib/telemetry'
import { toLocalDateStr, weekStartKey } from '@/domain/dates'
import {
  DEFAULT_STEPS_GOAL,
  calculateCalories,
  calculateDistance,
  getMonthlyHeatmap,
  getStreak,
} from '@/domain/stepsTracker'
import { getUnlockedStepAchievements } from '@/domain/stepAchievements'
import type { StepSource } from '@/domain/types'

export const useStepData = () => {
  const entries = useLiveList(() => stepRepo.getAll())

  // Meta diaria reactiva: mientras carga la query por primera vez, el default.
  const goal = useLiveQuery(() => stepRepo.getGoal(), []) ?? DEFAULT_STEPS_GOAL

  const today = useMemo(() => {
    const t = toLocalDateStr()
    return entries.find((e) => e.localDate === t)
  }, [entries])

  // Semana actual = días cuya clave de semana coincide con la de hoy.
  const week = useMemo(() => {
    const key = weekStartKey(toLocalDateStr())
    return entries.filter((e) => weekStartKey(e.localDate) === key)
  }, [entries])

  // Mes actual = días cuyo prefijo YYYY-MM coincide con el de hoy.
  const month = useMemo(() => {
    const prefix = toLocalDateStr().slice(0, 7)
    return entries.filter((e) => e.localDate.slice(0, 7) === prefix)
  }, [entries])

  const streak = useMemo(() => getStreak(entries, goal), [entries, goal])

  const heatmap = useMemo(() => getMonthlyHeatmap(month, goal), [month, goal])

  const achievements = useMemo(() => getUnlockedStepAchievements(entries), [entries])

  // Registra los pasos de hoy: calcula distancia (zancada vigente) y calorías
  // aproximadas, persiste el día y emite telemetría de la fuente.
  const recordSteps = useCallback(async (steps: number, source: StepSource = 'manual') => {
    const strideLengthCm = await stepRepo.getStrideLengthCm()
    const distanceKm = calculateDistance(steps, strideLengthCm)
    const calories = calculateCalories(steps, 0)
    await stepRepo.upsert({ localDate: toLocalDateStr(), steps, distanceKm, calories, source })
    track('steps_recorded', { source })
  }, [])

  const setGoal = useCallback((steps: number) => stepRepo.setGoal(steps), [])

  return { today, week, month, streak, heatmap, achievements, goal, recordSteps, setGoal }
}