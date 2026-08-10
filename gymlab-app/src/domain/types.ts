// Tipos de dominio compartidos por toda la app: entrenamientos, rutinas, cuerpo, perfil, papers y posts sociales.
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

export type FatigueLevel = 'fresh' | 'warm' | 'fatigued' | 'sore'

export type ExerciseCategory = 'strength' | 'stretch' | 'cardio' | 'mobility'

export interface Exercise {
  id: number
  slug: string
  name: string
  muscleGroup: MuscleGroup
  equipment: Equipment
  instructions: string
  imageUrls?: string[]
  externalId?: string
  category?: ExerciseCategory
  // Pasos detallados de ejecución para la ficha (lista numerada con tips/warnings).
  detailedSteps?: ExerciseStep[]
}

// Paso de ejecución de un ejercicio: número ordinal, instrucción y avisos opcionales.
export interface ExerciseStep {
  step: number
  instruction: string
  tip?: string
  warning?: string
}

export interface Routine {
  id: number
  slug: string
  title: string
  objective: Objective
  level: Level
  description: string
  daysCount: number
  isCustom?: boolean
  // Foto local de la rutina (/images/routines/<slug>.jpg); las custom no la tienen.
  imageUrl?: string
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
  supersetGroup?: string
  notes?: string
}

export interface Workout {
  id: number
  startedAt: string
  finishedAt: string | null
  routineId: number | null
  routineDayId: number | null
  localDate: string
  notes: string
  // Volumen total (kg × reps) de las series completadas, precalculado para evitar recomputarlo en la UI.
  totalVolume: number
}

// Una serie registrada dentro de una sesión (peso, repeticiones y marcadores opcionales RPE/RIR).
export interface WorkoutSet {
  id: number
  workoutId: number
  exerciseId: number
  setNumber: number
  weightKg: number
  reps: number
  completed: boolean
  createdAt: string
  rpe?: number
  rir?: number
  isWarmup?: boolean
  supersetGroup?: string
}

// Registro diario de peso corporal.
export interface BodyWeightEntry {
  id: number
  localDate: string
  weightKg: number
  note?: string
  createdAt: string
}

export type BodyZoneGroup = 'tronco' | 'brazos' | 'piernas'

export type BodyZone =
  | 'cuello'
  | 'hombros'
  | 'pecho'
  | 'cintura'
  | 'abdomen'
  | 'caderas'
  | 'biceps_izq'
  | 'biceps_der'
  | 'antebrazo_izq'
  | 'antebrazo_der'
  | 'muneca_izq'
  | 'muneca_der'
  | 'muslo_izq'
  | 'muslo_der'
  | 'pantorrilla_izq'
  | 'pantorrilla_der'
  | 'tobillo_izq'
  | 'tobillo_der'

// Registro de medidas por zonas corporales (solo las zonas medidas ese día, en cm).
export interface BodyMeasurementEntry {
  id: number
  localDate: string
  values: Partial<Record<BodyZone, number>>
  createdAt: string
}

export type Sex = 'male' | 'female'

export type SkinfoldSite =
  | 'triceps'
  | 'subescapular'
  | 'suprailiaco'
  | 'abdominal'
  | 'muslo'
  | 'pectoral'
  | 'axilar'

// Registro de pliegues cutáneos con los datos necesarios para Jackson-Pollock (sexo, edad y peso opcional).
export interface SkinfoldEntry {
  id: number
  localDate: string
  sex: Sex
  age: number
  weightKg: number | null
  sites: Partial<Record<SkinfoldSite, number>>
  createdAt: string
}

export interface ExerciseNote {
  exerciseId: number
  note: string
  updatedAt: string
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

export type GuideCategory =
  | 'entrenamiento'
  | 'nutricion'
  | 'dietas'
  | 'suplementos'
  | 'mujer'
  | 'recuperacion'

export interface Guide {
  id: number
  slug: string
  category: GuideCategory
  title: string
  summary: string
  keyPoints: string[]
  sourceUrl: string
}

export interface Profile {
  id: number
  displayName: string
  weeklyGoal: number
  createdAt: string
  userId: string
}

/** weekdays: 0=Sun … 6=Sat matching JS getDay(); maps to routine dayIndex in cycle order */
export interface ActiveProgram {
  id: number
  routineId: number
  startDate: string
  weekdays: number[]
  createdAt: string
  deloadActive?: boolean
  deloadUntil?: string | null
}

export interface VolumeSet {
  weightKg: number
  reps: number
}

// Récord personal: mejor 1RM estimado por ejercicio.
export interface PRRecord {
  exerciseId: number
  weightKg: number
  reps: number
  date: string
  estimated1RM: number
}

// Resultado del cálculo de rachas de entrenamiento.
export interface StreakResult {
  currentStreak: number
  longestStreak: number
  lastWorkoutDate: string | null
}

export interface MetaRow {
  key: string
  value: string
}

/** Social stubs — local-first; remoteId/syncedAt for future Supabase */
export interface SocialProfile {
  id: string
  handle: string
  displayName: string
  avatarUrl: string | null
  bio: string
  createdAt: string
  remoteId: string | null
  syncedAt: string | null
}

export type PostType = 'workout' | 'photo' | 'text'
export type PostVisibility = 'private' | 'friends' | 'public'

export interface Post {
  id: string
  authorId: string
  type: PostType
  workoutId: number | null
  caption: string
  mediaIds: string[]
  visibility: PostVisibility
  createdAt: string
  remoteId: string | null
  syncedAt: string | null
}

export interface PostMedia {
  id: string
  localUri: string
  mimeType: string
  width: number | null
  height: number | null
  createdAt: string
  remoteId: string | null
  syncedAt: string | null
}
