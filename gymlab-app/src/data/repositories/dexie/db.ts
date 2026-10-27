// Definición de la base IndexedDB (Dexie) y sus migraciones versionadas.
// Solo los repositorios importan db; la UI nunca la toca. Cada versión nueva
// del schema debe añadirse aquí sin modificar las anteriores.
import Dexie, { type EntityTable, type Table } from 'dexie'
import type {
  Exercise,
  Routine,
  RoutineDay,
  RoutineItem,
  Workout,
  WorkoutSet,
  Paper,
  Profile,
  PRRow,
  ExerciseAliasRow,
  Guide,
  ActiveProgram,
  MetaRow,
  SocialProfile,
  Post,
  PostMedia,
  BodyWeightEntry,
  DailyStepsEntry,
  ExerciseNote,
  BodyMeasurementEntry,
  SkinfoldEntry,
  SessionJournalEntry,
  BenchmarkResult,
  FoodItem,
  MealEntry,
  SupplementEntry,
  ProgressPhotoEntry,
  WorkoutTemplate,
  PeriodizationPlanRow,
} from '@/domain/types'
import { migrateJournalNotesToWorkouts } from '@/data/sessionNoteMigration'
import { rebuildPrsAndVolumes } from '@/data/migrations/rebuildPrsAndVolumes'

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
  prs: Table<PRRow, number>
  exerciseAlias: EntityTable<ExerciseAliasRow, 'from'>
  meta: EntityTable<MetaRow, 'key'>
  socialProfiles: EntityTable<SocialProfile, 'id'>
  posts: EntityTable<Post, 'id'>
  postMedia: EntityTable<PostMedia, 'id'>
  bodyWeight: EntityTable<BodyWeightEntry, 'id'>
  dailySteps: EntityTable<DailyStepsEntry, 'id'>
  exerciseNotes: EntityTable<ExerciseNote, 'exerciseId'>
  bodyMeasurements: EntityTable<BodyMeasurementEntry, 'id'>
  skinfolds: EntityTable<SkinfoldEntry, 'id'>
  sessionJournals: EntityTable<SessionJournalEntry, 'id'>
  benchmarkResults: EntityTable<BenchmarkResult, 'id'>
  foods: EntityTable<FoodItem, 'id'>
  mealEntries: EntityTable<MealEntry, 'id'>
  supplements: EntityTable<SupplementEntry, 'id'>
  progressPhotos: EntityTable<ProgressPhotoEntry, 'id'>
  workoutTemplates: EntityTable<WorkoutTemplate, 'id'>
  periodizationPlans: EntityTable<PeriodizationPlanRow, 'id'>
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

// v5: añade bitácora post-entreno (journal de sesión).
db.version(5).stores({
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
  sessionJournals: 'id, workoutId',
})

// v6: añade resultados de benchmark tests (fuerza máxima).
db.version(6).stores({
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
  sessionJournals: 'id, workoutId',
  benchmarkResults: 'id, exercise, testedAt',
})

// v7: añade nutrición (catálogo de alimentos y registros de comida).
db.version(7).stores({
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
  sessionJournals: 'id, workoutId',
  benchmarkResults: 'id, exercise, testedAt',
  foods: 'id, name, category',
  mealEntries: 'id, localDate, mealType',
})

// v8: añade suplementación (tracking de suplementos).
db.version(8).stores({
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
  sessionJournals: 'id, workoutId',
  benchmarkResults: 'id, exercise, testedAt',
  foods: 'id, name, category',
  mealEntries: 'id, localDate, mealType',
  supplements: 'id, name, active',
})

// v9: fotos de progreso corporal (frente/lateral/espalda).
db.version(9).stores({
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
  sessionJournals: 'id, workoutId',
  benchmarkResults: 'id, exercise, testedAt',
  foods: 'id, name, category',
  mealEntries: 'id, localDate, mealType',
  supplements: 'id, name, active',
  progressPhotos: 'id, localDate',
})

// v10: campos de cardio en workoutSets (durationSeconds, distanceMeters).
db.version(10).stores({
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
  sessionJournals: 'id, workoutId',
  benchmarkResults: 'id, exercise, testedAt',
  foods: 'id, name, category',
  mealEntries: 'id, localDate, mealType',
  supplements: 'id, name, active',
  progressPhotos: 'id, localDate',
})

// v11: templates de sesión rápida (custom del usuario).
db.version(11).stores({
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
  sessionJournals: 'id, workoutId',
  benchmarkResults: 'id, exercise, testedAt',
  foods: 'id, name, category',
  mealEntries: 'id, localDate, mealType',
  supplements: 'id, name, active, lastCheckedAt',
  progressPhotos: 'id, localDate',
  workoutTemplates: 'id, category',
})

// v12: plan de periodización.
db.version(12).stores({
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
  sessionJournals: 'id, workoutId',
  benchmarkResults: 'id, exercise, testedAt',
  foods: 'id, name, category',
  mealEntries: 'id, localDate, mealType',
  supplements: 'id, name, active',
  progressPhotos: 'id, localDate',
  workoutTemplates: 'id, category',
  periodizationPlans: 'id, isActive, createdAt',
})

// v13: registro diario de pasos (una fila por localDate, índice único por día).
db.version(13).stores({
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
  dailySteps: 'id, &localDate',
  exerciseNotes: 'exerciseId',
  bodyMeasurements: 'id, localDate',
  skinfolds: 'id, localDate',
  sessionJournals: 'id, workoutId',
  benchmarkResults: 'id, exercise, testedAt',
  foods: 'id, name, category',
  mealEntries: 'id, localDate, mealType',
  supplements: 'id, name, active',
  progressPhotos: 'id, localDate',
  workoutTemplates: 'id, category',
  periodizationPlans: 'id, isActive, createdAt',
})

// v14: índice por `date` en `prs` para consultar solo la ventana de una sesión
// (F120/S2) sin materializar la tabla completa en cada detalle del historial.
db.version(14).stores({
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
  prs: 'exerciseId, date',
  meta: 'key',
  socialProfiles: 'id, handle',
  posts: 'id, authorId, createdAt, type',
  postMedia: 'id',
  bodyWeight: 'id, localDate',
  dailySteps: 'id, &localDate',
  exerciseNotes: 'exerciseId',
  bodyMeasurements: 'id, localDate',
  skinfolds: 'id, localDate',
  sessionJournals: 'id, workoutId',
  benchmarkResults: 'id, exercise, testedAt',
  foods: 'id, name, category',
  mealEntries: 'id, localDate, mealType',
  supplements: 'id, name, active',
  progressPhotos: 'id, localDate',
  workoutTemplates: 'id, category',
  periodizationPlans: 'id, isActive, createdAt',
})

// v15: unifica la nota de sesión en workouts.notes (F84): mueve la nota del
// journal al workout y limpia el campo viejo (fuente única).
db.version(15)
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
    prs: 'exerciseId, date',
    meta: 'key',
    socialProfiles: 'id, handle',
    posts: 'id, authorId, createdAt, type',
    postMedia: 'id',
    bodyWeight: 'id, localDate',
    dailySteps: 'id, &localDate',
    exerciseNotes: 'exerciseId',
    bodyMeasurements: 'id, localDate',
    skinfolds: 'id, localDate',
    sessionJournals: 'id, workoutId',
    benchmarkResults: 'id, exercise, testedAt',
    foods: 'id, name, category',
    mealEntries: 'id, localDate, mealType',
    supplements: 'id, name, active',
    progressPhotos: 'id, localDate',
    workoutTemplates: 'id, category',
    periodizationPlans: 'id, isActive, createdAt',
  })
  .upgrade(async (tx) => {
    await migrateJournalNotesToWorkouts(tx)
  })

// v16: elimina la tabla `prs` con la clave vieja (exerciseId). La clave nueva
// ([exerciseId + reps]) no se puede imponer cambiando la primary key de una tabla
// existente; Dexie exige borrarla y recrearla. La v17 la crea y la reconstruye.
db.version(16).stores({
  prs: null,
})

// v17: PR como hecho por ejercicio y reps (1..12), sin `estimated1RM` persistido.
// Reconstruye los récords desde `workoutSets` y backfillea `workouts.totalVolume`
// con la política de warmups (solo series de trabajo). Ambas operaciones son
// deterministas y re-ejecutables: la tabla de PRs se puede tirar y volver a generar.
db.version(17)
  .stores({
    prs: '++id, &[exerciseId+reps], exerciseId, reps, date',
    exerciseAlias: 'from, to',
  })
  .upgrade(async (tx) => {
    const sets = await tx.table('workoutSets').toArray()
    const { prs, volumeByWorkout } = rebuildPrsAndVolumes(sets)
    const now = new Date().toISOString()

    await tx.table('prs').clear()
    if (prs.length > 0) {
      await tx.table('prs').bulkAdd(
        prs.map((pr) => ({ ...pr, uid: newUid(), updatedAt: now }))
      )
    }

    const workouts = await tx.table('workouts').toArray()
    for (const w of workouts) {
      const volume = volumeByWorkout.get(w.id) ?? 0
      if (w.totalVolume !== volume) {
        await tx.table('workouts').update(w.id, { totalVolume: volume })
      }
    }
  })

// UUID v4 no criptográfico de respaldo: `crypto.randomUUID` no existe en http LAN.
function newUid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export { db }
// Versión del seed: al cambiarla, reseeder vuelve a sembrar catálogo y rutinas.
export const SEED_VERSION = '23'
