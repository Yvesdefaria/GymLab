import type { EsSchema } from '../es'
import { workout } from './workout'
import { stats } from './stats'
import { routines } from './routines'
import { nutrition } from './nutrition'
import { features } from './features'
import { core } from './core'
import { help } from './help'
import { tour } from './tour'

export const en: EsSchema = {
  ...workout,
  ...stats,
  ...routines,
  ...nutrition,
  ...features,
  ...core,
  help,
  tour,
}

