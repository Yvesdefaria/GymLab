export type MuscleGroup =
  | 'pecho'
  | 'espalda'
  | 'biceps'
  | 'triceps'
  | 'hombro'
  | 'pierna'
  | 'gluteo'
  | 'abdomen'
  | 'trapecios'
  | 'antebrazo'
  | 'cardio'

export type Equipment =
  | 'barra'
  | 'mancuernas'
  | 'maquina'
  | 'polea'
  | 'banco'
  | 'cuerda'
  | 'kettlebell'
  | 'banda'
  | 'peso corporal'
  | 'otro'

export type Objective = 'volumen' | 'definicion' | 'fuerza' | 'resistencia' | 'general'

export type Level = 'principiante' | 'intermedio' | 'avanzado'

export interface Exercise {
  id: number
  slug: string
  name: string
  muscleGroup: MuscleGroup
  equipment: Equipment
  instructions: string
}

export interface Routine {
  id: number
  slug: string
  title: string
  objective: Objective
  level: Level
  description: string
  daysCount: number
}

export interface RoutineDay {
  id: number
  routineId: number
  dayIndex: number
  name: string
}

export interface RoutineItem {
  id: number
  routineDayId: number
  exerciseId: number
  targetSets: number
  targetReps: number
  restSec: number
  order: number
}

export interface Workout {
  id: number
  startedAt: string
  finishedAt: string | null
  routineId: number | null
  notes: string
  totalVolume: number
}

export interface WorkoutSet {
  id: number
  workoutId: number
  exerciseId: number
  setNumber: number
  weightKg: number
  reps: number
  completed: boolean
  createdAt: string
}

export interface Paper {
  id: number
  slug: string
  title: string
  authors: string
  year: number
  topic: string
  summary: string
  keyPoints: string[]
  sourceUrl: string
  doi: string
}

export interface Profile {
  id: number
  displayName: string
  weeklyGoal: number
  createdAt: string
}

export interface VolumeSet {
  weightKg: number
  reps: number
}

export interface PRRecord {
  exerciseId: number
  weightKg: number
  reps: number
  date: string
  estimated1RM: number
}

export interface StreakResult {
  currentStreak: number
  longestStreak: number
  lastWorkoutDate: string | null
}
