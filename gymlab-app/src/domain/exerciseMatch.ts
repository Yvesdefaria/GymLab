// Matcher puro de ejercicios para el import (F81): indexa el catálogo por nombre,
// slug y externalId normalizados, con fallback por tokens ordenados. Sin React ni Dexie.
import type { Exercise } from './types'
import type { ExerciseResolver } from './importParsers'

// Marcas diacríticas combinantes que deja NFD (tilde, cedilla, diéresis…).
const DIACRITICS = /[\u0300-\u036f]/g

// Normaliza para comparar: sin acentos, minúsculas y todo no alfanumérico a espacios.
export const normalize = (raw: string): string =>
  raw
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

// Clave insensible al orden de palabras («Bench Press Barbell» ≡ «Barbell Bench Press»).
export const tokenKey = (s: string): string =>
  normalize(s).split(' ').filter(Boolean).sort().join(' ')

// Construye el resolver contra el catálogo. En colisión de clave gana el id más
// bajo: se recorre por id ascendente y no se pisa una clave ya presente.
export const buildExerciseMatcher = (exercises: Exercise[]): ExerciseResolver => {
  const exact = new Map<string, number>()
  const tokens = new Map<string, number>()

  for (const exercise of [...exercises].sort((a, b) => a.id - b.id)) {
    for (const rawKey of [exercise.name, exercise.slug, exercise.externalId ?? '']) {
      const key = normalize(rawKey)
      if (!key) continue
      if (!exact.has(key)) exact.set(key, exercise.id)
      const tokenized = tokenKey(key)
      if (tokenized && !tokens.has(tokenized)) tokens.set(tokenized, exercise.id)
    }
  }

  return (name) => {
    const key = normalize(name ?? '')
    if (!key) return null
    const direct = exact.get(key)
    if (direct !== undefined) return direct
    return tokens.get(tokenKey(key)) ?? null
  }
}
