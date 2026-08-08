// Definición de la base IndexedDB (Dexie) y sus migraciones versionadas.
// Solo los repositorios importan db; la UI nunca la toca. Cada versión nueva
// del schema debe añadirse aquí sin modificar las anteriores.
import Dexie, { type EntityTable } from 'dexie'
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
  MetaRow,
  SocialProfile,
  Post,
  PostMedia,
  BodyWeightEntry,
  ExerciseNote,
  BodyMeasurementEntry,
  SkinfoldEntry,
} from '@/domain/types'

const db = new Dexie('GymLabDB') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>
  routines: EntityTable<Routine, 'id'>
  routineDays: EntityTable<RoutineDay, 'id'>
  routineItems: EntityTable<RoutineItem, 'id'>
  workouts: EntityTable<Workout, 'id'>
  workoutSets: EntityTable<WorkoutSet, 'id'>
  papers: EntityTable<Paper, 'id'>
  guides: EntityTable<Guide, 'id'>
  profile: EntityTable<Profile, 'id'>
  activeProgram: EntityTable<ActiveProgram, 'id'>
  prs: EntityTable<PRRecord, 'exerciseId'>
  meta: EntityTable<MetaRow, 'key'>
  socialProfiles: EntityTable<SocialProfile, 'id'>
  posts: EntityTable<Post, 'id'>
  postMedia: EntityTable<PostMedia, 'id'>
  bodyWeight: EntityTable<BodyWeightEntry, 'id'>
  exerciseNotes: EntityTable<ExerciseNote, 'exerciseId'>
  bodyMeasurements: EntityTable<BodyMeasurementEntry, 'id'>
  skinfolds: EntityTable<SkinfoldEntry, 'id'>
}

// v1: schema inicial con catálogo y entrenamientos básicos.
db.version(1).stores({
  exercises: 'id, slug, muscleGroup',
  routines: 'id, slug, objective, level',
  routineDays: 'id, routineId',
  routineItems: 'id, routineDayId, exerciseId',
  workouts: 'id, startedAt, routineId',
  workoutSets: 'id, workoutId, exerciseId',
  papers: 'id, slug, topic',
  profile: 'id',
  prs: 'exerciseId',
})

// v2: añade guías, programa activo, meta y social; migra workouts a localDate.
db.version(2)
  .stores({
    exercises: 'id, slug, muscleGroup',
    routines: 'id, slug, objective, level',
    routineDays: 'id, routineId',
    routineItems: 'id, routineDayId, exerciseId',
    workouts: 'id, startedAt, routineId, localDate',
    workoutSets: 'id, workoutId, exerciseId',
    papers: 'id, slug, topic',
    guides: 'id, slug, category',
    profile: 'id',
    activeProgram: 'id, routineId',
    prs: 'exerciseId',
    meta: 'key',
    socialProfiles: 'id, handle',
    posts: 'id, authorId, createdAt, type',
    postMedia: 'id',
  })
  // Rellena localDate y routineDayId en workouts existentes para no perder datos.
  .upgrade(async (tx) => {
    const workouts = await tx.table('workouts').toArray()
    for (const w of workouts) {
      const started = w.startedAt ? new Date(w.startedAt) : new Date()
      const localDate =
        w.localDate ??
        `${started.getFullYear()}-${String(started.getMonth() + 1).padStart(2, '0')}-${String(started.getDate()).padStart(2, '0')}`
      await tx.table('workouts').update(w.id, {
        localDate,
        routineDayId: w.routineDayId ?? null,
      })
    }
  })

// v3: añade registro de peso y notas por ejercicio.
db.version(3).stores({
  exercises: 'id, slug, muscleGroup',
  routines: 'id, slug, objective, level',
  routineDays: 'id, routineId',
  routineItems: 'id, routineDayId, exerciseId',
  workouts: 'id, startedAt, routineId, localDate',
  workoutSets: 'id, workoutId, exerciseId',
  papers: 'id, slug, topic',
  guides: 'id, slug, category',
  profile: 'id',
  activeProgram: 'id, routineId',
  prs: 'exerciseId',
  meta: 'key',
  socialProfiles: 'id, handle',
  posts: 'id, authorId, createdAt, type',
  postMedia: 'id',
  bodyWeight: 'id, localDate',
  exerciseNotes: 'exerciseId',
})

// v4: añade medidas corporales y pliegues cutáneos.
db.version(4).stores({
  exercises: 'id, slug, muscleGroup',
  routines: 'id, slug, objective, level',
  routineDays: 'id, routineId',
  routineItems: 'id, routineDayId, exerciseId',
  workouts: 'id, startedAt, routineId, localDate',
  workoutSets: 'id, workoutId, exerciseId',
  papers: 'id, slug, topic',
  guides: 'id, slug, category',
  profile: 'id',
  activeProgram: 'id, routineId',
  prs: 'exerciseId',
  meta: 'key',
  socialProfiles: 'id, handle',
  posts: 'id, authorId, createdAt, type',
  postMedia: 'id',
  bodyWeight: 'id, localDate',
  exerciseNotes: 'exerciseId',
  bodyMeasurements: 'id, localDate',
  skinfolds: 'id, localDate',
})

export { db }
// Versión del seed: al cambiarla, reseeder vuelve a sembrar catálogo y rutinas.
export const SEED_VERSION = '13'
