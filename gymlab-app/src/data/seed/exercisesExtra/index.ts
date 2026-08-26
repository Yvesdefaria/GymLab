import type { Exercise } from '@/domain/types'
import { seedPierna } from './pierna'
import { seedHombro } from './hombro'
import { seedEspalda } from './espalda'
import { seedAbdomen } from './abdomen'
import { seedPecho } from './pecho'
import { seedTriceps } from './triceps'
import { seedBiceps } from './biceps'
import { seedAntebrazo } from './antebrazo'
import { seedGluteo } from './gluteo'
import { seedTrapecios } from './trapecios'

// Catálogo ampliado desde free-exercise-db (Unlicense / dominio público).
// Los 52 ejercicios curados viven en ../exercises.ts (ids 1-52).
// Split por grupo muscular para mantener archivos <200 líneas.
export const seedExercisesExtra: Exercise[] = [
  ...seedPierna,
  ...seedHombro,
  ...seedEspalda,
  ...seedAbdomen,
  ...seedPecho,
  ...seedTriceps,
  ...seedBiceps,
  ...seedAntebrazo,
  ...seedGluteo,
  ...seedTrapecios,
]
