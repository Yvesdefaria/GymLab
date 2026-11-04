// Clasificación por articulación a partir del grupo y el nombre del ejercicio.
// Fuente única: descansos y volumen (F137) consumen el mismo predicado.
// Los patrones son tolerantes a acentos porque el catálogo está en español.
import type { MuscleGroup } from './types'

// Grupos que típicamente son compuestos (multi-articulación).
const COMPOUND_MUSCLES: MuscleGroup[] = ['pecho', 'espalda', 'pierna', 'gluteo', 'hombro']

// Patrones de nombres que sugieren ejercicios compuestos (ES + EN, con y sin acento).
const COMPOUND_PATTERNS =
  /\b(squat|sentadilla|press|bench|banca|deadlift|peso muerto|row|remo|pull.?up|dominada|chin.?up|dip|fondos|lunge|zancada|clean|snatch|thrust|hip|leg.?press|prensa|hack|rom[aá]n|rumano|good.?morning|buenos d[ií]as|pull.?over|push.?up|flexi|dominad)\b/i

// Patrones de nombres que sugieren ejercicios de aislamiento.
const ISOLATION_PATTERNS =
  /\b(curl|extensi[oó]n|raise|elevaci[oó]n|lateral|fly|apertura|kickback|patada|preacher|concentration|hammer|martillo|reverse.?curl|face.?pull|shrug|encogimiento|calf|gemelo|wrist|muñeca|abduct|abducci[oó]n|adduct|aducci[oó]n)\b/i

// Compuesto = nombre con señal de multi-articulación, o grupo típicamente compuesto.
// El aislamiento explícito gana sobre el fallback del grupo.
export const isCompoundExercise = (muscleGroup: MuscleGroup, exerciseName: string): boolean => {
  if (COMPOUND_PATTERNS.test(exerciseName)) return true
  if (ISOLATION_PATTERNS.test(exerciseName)) return false
  return COMPOUND_MUSCLES.includes(muscleGroup)
}
