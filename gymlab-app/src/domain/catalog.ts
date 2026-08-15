// Vocabulario canónico del catálogo de ejercicios y rutinas: grupos musculares,
// equipamiento, categorías, objetivos y niveles con sus etiquetas ES/EN. Única fuente
// de verdad: domain/types.ts deriva los tipos desde estas listas y la UI consume las
// mismas listas y labels.
import type { Equipment, ExerciseCategory, Level, MuscleGroup, Objective } from './types'

export const MUSCLE_GROUPS = [
  'pecho', 'espalda', 'biceps', 'triceps', 'hombro',
  'pierna', 'gluteo', 'abdomen', 'trapecios', 'antebrazo',
] as const

export const EQUIPMENT_OPTIONS = [
  'barra', 'mancuernas', 'maquina', 'polea', 'peso corporal',
  'banco', 'kettlebell', 'banda', 'otro',
] as const

export const CATEGORY_OPTIONS = ['strength', 'stretch', 'cardio', 'mobility'] as const

export const MUSCLE_GROUP_LABELS_ES: Record<MuscleGroup, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  hombro: 'Hombro',
  pierna: 'Pierna',
  gluteo: 'Glúteo',
  abdomen: 'Abdomen',
  trapecios: 'Trapecios',
  antebrazo: 'Antebrazo',
}

export const MUSCLE_GROUP_LABELS_EN: Record<MuscleGroup, string> = {
  pecho: 'Chest',
  espalda: 'Back',
  biceps: 'Biceps',
  triceps: 'Triceps',
  hombro: 'Shoulders',
  pierna: 'Legs',
  gluteo: 'Glutes',
  abdomen: 'Abs',
  trapecios: 'Traps',
  antebrazo: 'Forearms',
}

export const EQUIPMENT_LABELS_EN: Record<Equipment, string> = {
  barra: 'Barbell',
  mancuernas: 'Dumbbells',
  maquina: 'Machine',
  polea: 'Cable',
  'peso corporal': 'Bodyweight',
  banco: 'Bench',
  kettlebell: 'Kettlebell',
  banda: 'Band',
  otro: 'Other',
}

export const CATEGORY_LABELS_ES: Record<ExerciseCategory, string> = {
  strength: 'Fuerza',
  stretch: 'Estiramiento',
  cardio: 'Cardio',
  mobility: 'Movilidad',
}

export const CATEGORY_LABELS_EN: Record<ExerciseCategory, string> = {
  strength: 'Strength',
  stretch: 'Stretch',
  cardio: 'Cardio',
  mobility: 'Mobility',
}

export const OBJECTIVES = ['volumen', 'definicion', 'fuerza', 'resistencia', 'general'] as const

export const LEVELS = ['principiante', 'intermedio', 'avanzado'] as const

export const OBJECTIVE_LABELS_ES: Record<Objective, string> = {
  volumen: 'Volumen',
  definicion: 'Definición',
  fuerza: 'Fuerza',
  resistencia: 'Resistencia',
  general: 'General',
}

export const OBJECTIVE_LABELS_EN: Record<Objective, string> = {
  volumen: 'Volume',
  definicion: 'Cut',
  fuerza: 'Strength',
  resistencia: 'Endurance',
  general: 'General',
}

export const LEVEL_LABELS_ES: Record<Level, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
}

export const LEVEL_LABELS_EN: Record<Level, string> = {
  principiante: 'Beginner',
  intermedio: 'Intermediate',
  avanzado: 'Advanced',
}
