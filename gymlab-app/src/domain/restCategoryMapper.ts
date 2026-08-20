// Mapeo de categorías de ejercicio del catálogo a categorías de descanso.
// Los ejercicios compuestos (múltiples articulaciones) necesitan más descanso que los de aislamiento.

import type { MuscleGroup, Objective } from './types'
import type { ExerciseCategory as RestCategory, TrainingGoal } from './restRecommendation'

// Grupos musculares que típicamente son compuestos (multi-articulación).
const COMPOUND_MUSCLES: MuscleGroup[] = [
  'pecho', 'espalda', 'pierna', 'gluteo', 'hombro',
]

// Patrones de nombres que sugieren ejercicios compuestos.
const COMPOUND_PATTERNS =
  /\b(squat|press|bench|deadlift|row|pull.?up|chin.?up|dip|lunge|clean|snatch|thrust|hip|leg.?press|hack|român|good.?morning|pull.?over|push.?up|flexi|dominad)\b/i

// Patrones de nombres que sugieren ejercicios de aislamiento.
const ISOLATION_PATTERNS =
  /\b(curl|extension|raise|lateral|fly|kickback|preacher|concentration|hammer|reverse.?curl|face.?pull|shrug|calf|wrist|abduct|adduct)\b/i

// Mapea muscle group + nombre a categoría de descanso (compuesto/aislamiento).
export const mapToRestCategory = (
  muscleGroup: MuscleGroup,
  exerciseName: string
): RestCategory => {
  if (COMPOUND_PATTERNS.test(exerciseName)) return 'compuesto'
  if (ISOLATION_PATTERNS.test(exerciseName)) return 'aislamiento'
  // Fallback: si el grupo muscular es típicamente compuesto → compuesto.
  return COMPOUND_MUSCLES.includes(muscleGroup) ? 'compuesto' : 'aislamiento'
}

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
