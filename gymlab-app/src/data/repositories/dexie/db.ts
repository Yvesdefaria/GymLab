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
} from '@/domain/types'

const db = new Dexie('GymLabDB') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>
  routines: EntityTable<Routine, 'id'>
  routineDays: EntityTable<RoutineDay, 'id'>
  routineItems: EntityTable<RoutineItem, 'id'>
  workouts: EntityTable<Workout, 'id'>
  workoutSets: EntityTable<WorkoutSet, 'id'>
  papers: EntityTable<Paper, 'id'>
  profile: EntityTable<Profile, 'id'>
  prs: EntityTable<PRRecord, 'exerciseId'>
}

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

export { db }
