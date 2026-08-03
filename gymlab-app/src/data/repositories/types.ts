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
  Objective,
  Level,
} from '@/domain/types'

export interface ExerciseRepository {
  getAll(): Promise<Exercise[]>
  getBySlug(slug: string): Promise<Exercise | undefined>
  getById(id: number): Promise<Exercise | undefined>
}

export interface RoutineDayDraft {
  name: string
  items: {
    exerciseId: number
    targetSets: number
    targetReps: number
    restSec: number
    order: number
  }[]
}

export interface RoutineDraft {
  slug: string
  title: string
  objective: Objective
  level: Level
  description: string
  days: RoutineDayDraft[]
}

export interface RoutineRepository {
  getAll(): Promise<Routine[]>
  getBySlug(slug: string): Promise<Routine | undefined>
  getDays(routineId: number): Promise<RoutineDay[]>
  getItems(routineDayId: number): Promise<RoutineItem[]>
  createRoutine(draft: RoutineDraft): Promise<number>
  updateRoutine(id: number, draft: RoutineDraft): Promise<void>
  deleteRoutine(id: number): Promise<void>
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
  getAll(): Promise<WorkoutSet[]>
  create(set: Omit<WorkoutSet, 'id'>): Promise<number>
  update(id: number, changes: Partial<WorkoutSet>): Promise<unknown>
  delete(id: number): Promise<unknown>
}

export interface PaperRepository {
  getAll(): Promise<Paper[]>
  getBySlug(slug: string): Promise<Paper | undefined>
}

export interface GuideRepository {
  getAll(): Promise<Guide[]>
  getBySlug(slug: string): Promise<Guide | undefined>
}

export interface ProfileRepository {
  get(): Promise<Profile | undefined>
  ensure(): Promise<Profile>
  update(changes: Partial<Profile>): Promise<unknown>
}

export interface ActiveProgramRepository {
  get(): Promise<ActiveProgram | undefined>
  set(program: Omit<ActiveProgram, 'id'>): Promise<number>
  clear(): Promise<unknown>
}

export interface PRRepository {
  getAll(): Promise<PRRecord[]>
  getByExercise(exerciseId: number): Promise<PRRecord | undefined>
  upsert(pr: PRRecord): Promise<unknown>
}

export interface SocialRepository {
  getProfile(id: string): Promise<SocialProfile | undefined>
  upsertProfile(profile: SocialProfile): Promise<unknown>
  listPostsByAuthor(authorId: string): Promise<Post[]>
  createPost(post: Post): Promise<unknown>
  addMedia(media: PostMedia): Promise<unknown>
}
