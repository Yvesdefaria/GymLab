// Índice alfabético de la biblioteca: orden localizado por nombre y agrupación por inicial.
import type { Exercise } from '@/domain/types'

// Sección del índice: letra inicial en mayúscula (normalizada) y sus ejercicios.
export interface ExerciseSection {
  letter: string
  count: number
  items: Exercise[]
}

// Separa la base de una letra acentuada («á» → «a») conservando la eñe:
// la ñ se descompone en «n + tilde combinante» y esa tilde (U+0303) no se borra.
const stripDiacritics = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, (mark) => (mark === '\u0303' ? mark : ''))
    .normalize('NFC')

// Primera letra significante del nombre, en mayúscula según el idioma.
// Los nombres que no empiezan por una letra (p. ej. «3/4 abdominal») se agrupan
// bajo el marcador «#» para no ocupar un hueco del índice alfabético.
export const charInitial = (name: string, locale: string): string => {
  const base = Array.from(stripDiacritics(name))[0] ?? ''
  const upper = base.toLocaleUpperCase(locale)
  return /^[A-ZÑ]$/.test(upper) ? upper : '#'
}

// Ordena por nombre localizado (insensible a mayúsculas y acentos) sin mutar la entrada.
export const sortExercisesAlphabetically = (exercises: Exercise[], locale: string): Exercise[] => {
  const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true })
  return [...exercises].sort((a, b) => collator.compare(a.name, b.name))
}

// Agrupa una lista ya ordenada en secciones por inicial (preserva el orden de entrada).
export const groupExercisesByInitial = (sorted: Exercise[], locale: string): ExerciseSection[] => {
  const sections: ExerciseSection[] = []
  for (const ex of sorted) {
    const letter = charInitial(ex.name, locale)
    const last = sections[sections.length - 1]
    if (last && last.letter === letter) {
      last.count += 1
      last.items.push(ex)
    } else {
      sections.push({ letter, count: 1, items: [ex] })
    }
  }
  return sections
}

// Ordena y agrupa en un solo paso; resultado listo para pintar el índice.
export const sortAndGroupExercises = (exercises: Exercise[], locale: string): ExerciseSection[] =>
  groupExercisesByInitial(sortExercisesAlphabetically(exercises, locale), locale)