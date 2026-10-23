// Hook del contador de pasos: hoy, semana, racha, meta y operaciones de escritura.
// El mes y el año se derivan en la página con domain/stepAnalytics para que el
// calendario pueda navegar a meses anteriores.
// F120/P1: las entradas llegan del proveedor único (useAchievementsData().stepDays).
import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { stepRepo } from '@/data/repositories'
import { track } from '@/lib/telemetry'
import { toLocalDateStr, weekStartKey } from '@/domain/dates'
import {
  DEFAULT_STEPS_GOAL,
  calculateCalories,
  calculateDistance,
  getStreak,
} from '@/domain/stepsTracker'
import type { DailyStepsEntry, StepSource } from '@/domain/types'

export const useStepData = (entries: DailyStepsEntry[]) => {
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

  const streak = useMemo(() => getStreak(entries, goal), [entries, goal])

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

  return { today, week, streak, goal, recordSteps, setGoal }
}
