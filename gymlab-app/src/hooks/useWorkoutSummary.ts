// Fuente única de los KPIs de entrenamiento derivados (racha, volúmenes, frecuencia, PRs).
import { useMemo } from 'react'
import { useWorkouts } from '@/hooks/useWorkouts'
import { usePRs } from '@/hooks/usePRs'
import { weeklyVolume } from '@/domain/workouts'
import { avgSessionDurationMin, maxStreakWeeks, trainedDaysInLast } from '@/domain/trainingStats'
import { calcStreak } from '@/domain/streak'
import { localDateOf } from '@/domain/dates'

// Derivados agregados de los repos; consumido por Perfil y Estadísticas para no recalcular KPIs.
export const useWorkoutSummary = () => {
  const { workouts } = useWorkouts()
  const { prs } = usePRs()

  // Racha derivada del mismo array de workouts ya cargado (evita un segundo getAll()).
  const streak = useMemo(() => calcStreak(workouts.map(localDateOf)), [workouts])

  const weeklyVolumeValue = useMemo(() => weeklyVolume(workouts), [workouts])
  const totalVolume = useMemo(() => workouts.reduce((acc, w) => acc + w.totalVolume, 0), [workouts])
  const maxStreak = useMemo(() => maxStreakWeeks(workouts), [workouts])
  const days30 = useMemo(() => trainedDaysInLast(workouts, 30), [workouts])
  const avgDuration = useMemo(() => avgSessionDurationMin(workouts), [workouts])

  return {
    workouts,
    streak,
    currentStreak: streak.currentStreak,
    maxStreak,
    days30,
    avgDuration,
    weeklyVolume: weeklyVolumeValue,
    totalVolume,
    totalWorkouts: workouts.length,
    totalPrs: prs.length,
  }
}