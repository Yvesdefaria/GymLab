import type { EsSchema } from '../es'
import { workout } from './workout'
import { stats } from './stats'
import { routines } from './routines'
import { nutrition } from './nutrition'
import { features } from './features'
import { core } from './core'

export const en: EsSchema = {
  ...workout,
  ...stats,
  ...routines,
  ...nutrition,
  ...features,
  ...core,
}

