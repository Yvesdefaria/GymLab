// F137 — sección de volumen: conecta el dominio con la vista y arma el mapa de ejercicios.
import { useMemo } from 'react'
import type { Exercise, Workout, WorkoutSet } from '@/domain/types'
import { useMuscleVolume } from '@/hooks/useMuscleVolume'
import { MuscleVolumeView } from './MuscleVolumeView'

interface Props {
  sets: WorkoutSet[]
  workouts: Workout[]
  workoutsById: ReadonlyMap<number, Workout>
  exercises: Exercise[]
}

export const MuscleVolumeSection = ({ sets, workouts, workoutsById, exercises }: Props) => {
  const exercisesById = useMemo(() => new Map(exercises.map((exercise) => [exercise.id, exercise])), [exercises])
  const volume = useMuscleVolume({ sets, workouts, workoutsById, exercisesById })

  return (
    <MuscleVolumeView
      range={volume.range}
      onRangeChange={volume.setRange}
      stats={volume.stats}
      signals={volume.signals}
      weekly={volume.weekly}
      reps={volume.reps}
      partial={volume.partial}
    />
  )
}
