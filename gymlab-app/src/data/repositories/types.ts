// Contratos (interfaces) de la capa de datos: definen qué puede hacer la UI sin
// acoplarse a IndexedDB. Cada interface tendrá su implementación Dexie en ./dexie.
import type {
  Exercise,
  Routine,
  RoutineDay,
  RoutineItem,
  Workout,
  WorkoutSet,
  Paper,
  Profile,
  PRRecord,
  Guide,
  ActiveProgram,
  SocialProfile,
  Post,
  PostMedia,
  BodyWeightEntry,
  ExerciseNote,
  BodyMeasurementEntry,
  SkinfoldEntry,
  SessionJournalEntry,
  WorkoutTemplate,
  BodyZone,
  Sex,
  BenchmarkResult,
  SkinfoldSite,
  Objective,
  Level,
  MealEntry,
  SupplementEntry,
  PeriodizationPlanRow,
  ProgressPhotoEntry,
} from '@/domain/types'

// Consultas de catálogo de ejercicios (seed + catálogo ampliado).
export interface ExerciseRepository {
  getAll(): Promise<Exercise[]>
  getBySlug(slug: string): Promise<Exercise | undefined>
  getById(id: number): Promise<Exercise | undefined>
}

// Borrador con el que se crean/actualizan rutinas personalizadas y sus días.
export interface RoutineDayDraft {
  name: string
  items: {
    exerciseId: number
    targetSets: number
    targetReps: number
    restSec: number
    order: number
    supersetGroup?: string
    notes?: string
  }[]
}

// Borrador completo de una rutina personalizada (cabecera + días).
export interface RoutineDraft {
  slug: string
  title: string
  objective: Objective
  level: Level
  description: string
  days: RoutineDayDraft[]
}

// CRUD de rutinas (catálogo + personalizadas) con sus días y ejercicios.
export interface RoutineRepository {
  getAll(): Promise<Routine[]>
  getBySlug(slug: string): Promise<Routine | undefined>
  getDays(routineId: number): Promise<RoutineDay[]>
  getItems(routineDayId: number): Promise<RoutineItem[]>
  createRoutine(draft: RoutineDraft): Promise<number>
  updateRoutine(id: number, draft: RoutineDraft): Promise<void>
  deleteRoutine(id: number): Promise<void>
  reorderItems(routineDayId: number, itemIds: number[]): Promise<void>
}

// Histórico de entrenamientos (cabeceras de sesión).
export interface WorkoutRepository {
  getAll(): Promise<Workout[]>
  getById(id: number): Promise<Workout | undefined>
  getMany(ids: number[]): Promise<Workout[]>
  create(workout: Omit<Workout, 'id'>): Promise<number>
  update(id: number, changes: Partial<Workout>): Promise<unknown>
  delete(id: number): Promise<unknown>
}

// Series guardadas por entrenamiento o ejercicio; getLastSets alimenta los marcadores de sesión.
export interface WorkoutSetRepository {
  getByWorkout(workoutId: number): Promise<WorkoutSet[]>
  getByExercise(exerciseId: number): Promise<WorkoutSet[]>
  getAll(): Promise<WorkoutSet[]>
  create(set: Omit<WorkoutSet, 'id'>): Promise<number>
  update(id: number, changes: Partial<WorkoutSet>): Promise<unknown>
  delete(id: number): Promise<unknown>
  getLastSets(exerciseIds: number[]): Promise<Map<number, { weightKg: number; reps: number }>>
}

// Papers de la biblioteca (fuentes reales con DOI).
export interface PaperRepository {
  getAll(): Promise<Paper[]>
  getBySlug(slug: string): Promise<Paper | undefined>
}

// Guías informativas de nutrición y entrenamiento.
export interface GuideRepository {
  getAll(): Promise<Guide[]>
  getBySlug(slug: string): Promise<Guide | undefined>
}

// Perfil único del usuario (fila fija id=1); ensure lo crea si no existe.
export interface ProfileRepository {
  get(): Promise<Profile | undefined>
  ensure(): Promise<Profile>
  update(changes: Partial<Profile>): Promise<unknown>
}

// Programa activo del usuario (una sola fila) y su estado de deload.
export interface ActiveProgramRepository {
  get(): Promise<ActiveProgram | undefined>
  set(program: Omit<ActiveProgram, 'id'>): Promise<number>
  setDeload(deloadActive: boolean, deloadUntil?: string | null): Promise<unknown>
  clear(): Promise<unknown>
}

// Registro de récords personales por ejercicio (una fila por exerciseId).
export interface PRRepository {
  getAll(): Promise<PRRecord[]>
  getByExercise(exerciseId: number): Promise<PRRecord | undefined>
  upsert(pr: PRRecord): Promise<unknown>
}

// Perfiles y posts del feed social (muro entre usuarios).
export interface SocialRepository {
  getProfile(id: string): Promise<SocialProfile | undefined>
  upsertProfile(profile: SocialProfile): Promise<unknown>
  listPostsByAuthor(authorId: string): Promise<Post[]>
  createPost(post: Post): Promise<unknown>
  addMedia(media: PostMedia): Promise<unknown>
}

// Registro de peso corporal por fecha (una fila por día).
export interface BodyWeightRepository {
  getAll(): Promise<BodyWeightEntry[]>
  getByDate(localDate: string): Promise<BodyWeightEntry | undefined>
  upsert(entry: Pick<BodyWeightEntry, 'localDate' | 'weightKg'> & { note?: string }): Promise<number>
  delete(id: number): Promise<unknown>
}

// Medidas corporales por zona y fecha (una fila por día).
export interface BodyMeasurementRepository {
  getAll(): Promise<BodyMeasurementEntry[]>
  getByDate(localDate: string): Promise<BodyMeasurementEntry | undefined>
  upsert(entry: {
    localDate: string
    values: Partial<Record<BodyZone, number>>
  }): Promise<number>
  delete(id: number): Promise<unknown>
}

// Pliegues cutáneos por fecha, con sexo/edad/peso para cálculos de % graso.
export interface SkinfoldRepository {
  getAll(): Promise<SkinfoldEntry[]>
  getByDate(localDate: string): Promise<SkinfoldEntry | undefined>
  upsert(entry: {
    localDate: string
    sex: Sex
    age: number
    weightKg: number | null
    sites: Partial<Record<SkinfoldSite, number>>
  }): Promise<number>
  delete(id: number): Promise<unknown>
}

// Notas personales del usuario por ejercicio.
export interface ExerciseNoteRepository {
  getAll(): Promise<ExerciseNote[]>
  get(exerciseId: number): Promise<string>
  getByExerciseIds(exerciseIds: number[]): Promise<ExerciseNote[]>
  set(exerciseId: number, note: string): Promise<unknown>
}

// Bitácora post-entreno: una entrada por workout con energía, sueño, ánimo y dolor.
export interface SessionJournalRepository {
  getAll(): Promise<SessionJournalEntry[]>
  getByWorkout(workoutId: number): Promise<SessionJournalEntry | undefined>
  upsert(entry: {
    workoutId: number
    energy: 1 | 2 | 3 | 4 | 5
    sleep: 1 | 2 | 3 | 4 | 5
    mood: 1 | 2 | 3 | 4 | 5
    soreness: 1 | 2 | 3 | 4 | 5
    note?: string
  }): Promise<number>
  delete(workoutId: number): Promise<unknown>
}

// Templates de sesión rápida guardados por el usuario.
export interface WorkoutTemplateRepository {
  getAll(): Promise<WorkoutTemplate[]>
  getById(id: number): Promise<WorkoutTemplate | undefined>
  create(template: Omit<WorkoutTemplate, 'id' | 'createdAt'>): Promise<number>
  update(id: number, data: Partial<Omit<WorkoutTemplate, 'id' | 'createdAt'>>): Promise<void>
  delete(id: number): Promise<unknown>
}

// Benchmark tests: resultados de tests de fuerza predefinidos.
export interface BenchmarkRepository {
  getAll(): Promise<BenchmarkResult[]>
  getByExercise(exercise: BenchmarkResult['exercise']): Promise<BenchmarkResult[]>
  add(result: Omit<BenchmarkResult, 'id' | 'e1rm' | 'testedAt'>): Promise<number>
}

// Entradas de comida (registro diario de nutrición).
export interface MealRepository {
  getAll(): Promise<MealEntry[]>
  getByDate(localDate: string): Promise<MealEntry[]>
  add(meal: Omit<MealEntry, 'id' | 'createdAt'>): Promise<number>
  delete(id: number): Promise<unknown>
}

// Suplementos del usuario.
export interface SupplementRepository {
  getAll(): Promise<SupplementEntry[]>
  add(s: Omit<SupplementEntry, 'id' | 'createdAt'>): Promise<number>
  update(id: number, changes: Partial<SupplementEntry>): Promise<unknown>
  delete(id: number): Promise<unknown>
}

// Fotos de progreso corporal.
export interface ProgressPhotoRepository {
  getAll(): Promise<ProgressPhotoEntry[]>
  getByDate(localDate: string): Promise<ProgressPhotoEntry | undefined>
  upsert(entry: Omit<ProgressPhotoEntry, 'id' | 'createdAt'>): Promise<number>
  delete(id: number): Promise<unknown>
}

// Planes de periodización.
export interface PeriodizationRepository {
  getAll(): Promise<PeriodizationPlanRow[]>
  getActive(): Promise<PeriodizationPlanRow | undefined>
  create(plan: Omit<PeriodizationPlanRow, 'id' | 'createdAt'>): Promise<number>
  update(id: number, changes: Partial<PeriodizationPlanRow>): Promise<unknown>
  delete(id: number): Promise<unknown>
  setActive(id: number): Promise<unknown>
}
