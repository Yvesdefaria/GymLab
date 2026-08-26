import { workout } from './workout'
import { stats } from './stats'
import { routines } from './routines'
import { nutrition } from './nutrition'
import { features } from './features'
import { core } from './core'

export const es = {
  ...core,
  ...workout,
  ...stats,
  ...routines,
  ...nutrition,
  ...features,
} as const

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>
}

export type EsSchema = DeepStringify<typeof es>
