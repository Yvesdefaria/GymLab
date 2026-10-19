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

// Alturas fijas del índice alfabético renderizable (mismas en catálogo y selector).
export const INDEX_HEADER_HEIGHT = 36
export const INDEX_ROW_HEIGHT = 64
export const INDEX_ROW_GAP = 8

// Fila virtualizada del índice: cabecera de sección o ejercicio, con su offset acumulado en px.
export type AlphabetRow =
  | { type: 'header'; key: string; section: ExerciseSection; offset: number }
  | { type: 'exercise'; key: string; exercise: Exercise; offset: number }

// Aplana secciones ya ordenadas → filas con offset (alturas fijas: cabecera, fila y separación).
export const buildAlphabetRows = (sections: ExerciseSection[]): AlphabetRow[] => {
  const rows: AlphabetRow[] = []
  let offset = 0
  for (const section of sections) {
    rows.push({ type: 'header', key: `h-${section.letter}`, section, offset })
    offset += INDEX_HEADER_HEIGHT + INDEX_ROW_GAP
    for (const ex of section.items) {
      rows.push({ type: 'exercise', key: ex.slug, exercise: ex, offset })
      offset += INDEX_ROW_HEIGHT + INDEX_ROW_GAP
    }
  }
  return rows
}

// Clave estable de una fila virtualizada. Durante un encogimiento el virtualizer
// puede pedir la clave de un índice que ya no existe: cae al propio índice en vez
// de lanzar (mismo guard que `estimateSize`).
export const alphabetRowKeyAt = (rows: AlphabetRow[], index: number): string | number =>
  rows[index]?.key ?? index

// Destino del salto del rail: offset (px) de la cabecera de cada letra presente.
export const letterOffsetsFromRows = (rows: AlphabetRow[]): Map<string, number> => {
  const map = new Map<string, number>()
  for (const row of rows) {
    if (row.type === 'header') map.set(row.section.letter, row.offset)
  }
  return map
}

// Letra activa para una posición de scroll: la última cabecera alcanzada (la primera si aún no llegó).
export const letterAtOffset = (rows: AlphabetRow[], pos: number): string => {
  let letter = ''
  for (const row of rows) {
    if (row.type !== 'header') continue
    if (letter === '' || row.offset <= pos) letter = row.section.letter
    else break
  }
  return letter
}

// Abecedario del índice: en español la eñe es letra propia, justo después de la ene.
export const alphabetFor = (locale: string): string[] => {
  const letters = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
  if (locale === 'es') letters.splice(letters.indexOf('N') + 1, 0, 'Ñ')
  return letters
}