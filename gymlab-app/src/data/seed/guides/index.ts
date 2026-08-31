import type { Guide } from '@/domain/types'
import { seedGuides_nutricion } from './nutricion'
import { seedGuides_dietas } from './dietas'
import { seedGuides_suplementos } from './suplementos'
import { seedGuides_entrenamiento } from './entrenamiento'
import { seedGuides_recuperacion } from './recuperacion'
import { seedGuides_mujer } from './mujer'
import { seedGuides_leyenda } from './leyenda'

export const seedGuides: Guide[] = [
  ...seedGuides_nutricion,
  ...seedGuides_dietas,
  ...seedGuides_suplementos,
  ...seedGuides_entrenamiento,
  ...seedGuides_recuperacion,
  ...seedGuides_mujer,
  ...seedGuides_leyenda,
]
