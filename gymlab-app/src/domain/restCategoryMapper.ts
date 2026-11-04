// Mapeo de categorías de ejercicio del catálogo a categorías de descanso.
// Los ejercicios compuestos (múltiples articulaciones) necesitan más descanso que los de aislamiento.
import type { MuscleGroup, Objective } from './types'
import type { ExerciseCategory as RestCategory, TrainingGoal } from './restRecommendation'
import { isCompoundExercise } from './exercisePattern'

// Mapea muscle group + nombre a categoría de descanso (compuesto/aislamiento).
// El predicado vive en `exercisePattern` para que volumen (F137) y descanso compartan fuente.
export const mapToRestCategory = (
  muscleGroup: MuscleGroup,
  exerciseName: string
): RestCategory => (isCompoundExercise(muscleGroup, exerciseName) ? 'compuesto' : 'aislamiento')

// Mapea objetivo de la rutina a objetivo de descanso.
export const mapToTrainingGoal = (objective: Objective): TrainingGoal => {
  switch (objective) {
    case 'fuerza': return 'fuerza'
    case 'resistencia': return 'resistencia'
    case 'volumen':
    case 'definicion':
    case 'general':
    default: return 'hipertrofia'
  }
}
