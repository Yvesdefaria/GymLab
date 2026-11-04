// F137 — estado de la sección de volumen muscular: ventana móvil (7/28 días),
// conteo directo/efectivo, cobertura, señales y grupos que programa la rutina activa.
import { useMemo, useState } from 'react'
import { addLocalDays, diffLocalDays, toLocalDateStr } from '@/domain/dates'
import type { Exercise, MuscleGroup, Workout, WorkoutSet } from '@/domain/types'
import {
  buildCoverageReport,
  buildVolumeStats,
  countVolumeSets,
  WINDOW_DAYS,
} from '@/domain/volumeModel'
import {
  antagonistRatios,
  buildActionableSignals,
  lastTrainedByVolumeGroup,
} from '@/domain/volumeSignals'
import { useActiveProgram } from './useActiveProgram'
import { useRoutineDaysWithItems } from './useRoutines'

export type VolumeRange = 7 | typeof WINDOW_DAYS

interface Args {
  sets: readonly WorkoutSet[]
  workouts: readonly Workout[]
  workoutsById: ReadonlyMap<number, Workout>
  exercisesById: ReadonlyMap<number, Exercise>
}

export const useMuscleVolume = ({ sets, workouts, workoutsById, exercisesById }: Args) => {
  const [range, setRange] = useState<VolumeRange>(WINDOW_DAYS)
  const { routine } = useActiveProgram()
  const { selectableDays } = useRoutineDaysWithItems(routine?.id ?? null)

  // Trapecios solo alertan si la rutina activa los programa (F137).
  const scheduled = useMemo(() => {
    const groups = new Set<MuscleGroup>()
    for (const { items } of selectableDays) {
      for (const item of items) {
        if (item.exerciseMuscleGroup) groups.add(item.exerciseMuscleGroup)
      }
    }
    return { trapecios: groups.has('trapecios') }
  }, [selectableDays])

  const today = toLocalDateStr()
  const windowStart = addLocalDays(today, -(range - 1))

  const counts = useMemo(
    () => countVolumeSets(sets, workoutsById, exercisesById, windowStart, today),
    [sets, workoutsById, exercisesById, windowStart, today],
  )
  const coverage = useMemo(
    () => buildCoverageReport(sets, workoutsById, exercisesById, windowStart, today),
    [sets, workoutsById, exercisesById, windowStart, today],
  )
  const lastTrained = useMemo(
    () => lastTrainedByVolumeGroup(sets, workoutsById, exercisesById, today),
    [sets, workoutsById, exercisesById, today],
  )
  const antagonists = useMemo(() => antagonistRatios(counts.direct), [counts])

  // Semanas reales de historial: con menos de la ventana se divide por lo que hay y se
  // marca «datos parciales» (nunca alerta).
  const historyDays = useMemo(() => {
    const first = workouts.reduce<string>((min, workout) => {
      const date = workout.localDate
      return !min || date < min ? date : min
    }, '')
    return first ? diffLocalDays(first, today) + 1 : 0
  }, [workouts, today])
  const availableDays = Math.min(range, historyDays)
  const weeks = Math.max(1, Math.ceil(availableDays / 7))
  const partial = historyDays > 0 && availableDays < range

  const stats = useMemo(
    () => buildVolumeStats({ counts, coverage, weeks, partial, scheduled }),
    [counts, coverage, weeks, partial, scheduled],
  )
  const signals = useMemo(
    () => buildActionableSignals({ stats, lastTrained, antagonists }),
    [stats, lastTrained, antagonists],
  )

  return {
    range,
    setRange,
    stats,
    signals,
    coverage,
    counts,
    lastTrained,
    partial,
    weeks,
  }
}

export type MuscleVolumeState = ReturnType<typeof useMuscleVolume>
