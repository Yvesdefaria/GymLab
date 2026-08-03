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
} from '@/domain/types'

export interface ExerciseRepository {
  getAll(): Promise<Exercise[]>
  getBySlug(slug: string): Promise<Exercise | undefined>
  getById(id: number): Promise<Exercise | undefined>
}

export interface RoutineRepository {
  getAll(): Promise<Routine[]>
  getBySlug(slug: string): Promise<Routine | undefined>
  getDays(routineId: number): Promise<RoutineDay[]>
  getItems(routineDayId: number): Promise<RoutineItem[]>
}

export interface WorkoutRepository {
  getAll(): Promise<Workout[]>
  getById(id: number): Promise<Workout | undefined>
  create(workout: Omit<Workout, 'id'>): Promise<number>
  update(id: number, changes: Partial<Workout>): Promise<unknown>
  delete(id: number): Promise<unknown>
}

export interface WorkoutSetRepository {
  getByWorkout(workoutId: number): Promise<WorkoutSet[]>
  create(set: Omit<WorkoutSet, 'id'>): Promise<number>
  update(id: number, changes: Partial<WorkoutSet>): Promise<unknown>
  delete(id: number): Promise<unknown>
}

export interface PaperRepository {
  getAll(): Promise<Paper[]>
  getBySlug(slug: string): Promise<Paper | undefined>
}

export interface ProfileRepository {
  get(): Promise<Profile | undefined>
  update(changes: Partial<Profile>): Promise<unknown>
}

export interface PRRepository {
  getAll(): Promise<PRRecord[]>
  getByExercise(exerciseId: number): Promise<PRRecord | undefined>
  upsert(pr: PRRecord): Promise<unknown>
}
