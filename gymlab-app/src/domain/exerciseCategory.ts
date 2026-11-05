// Detección heurística de la categoría de un ejercicio (cardio/movilidad/estiramiento/fuerza) por su nombre.
import type { Exercise, ExerciseCategory } from './types'

// `row` queda fuera a propósito (F139.18): los remos con peso son fuerza y aportan
// volumen a espalda/hombro/trapecio. Solo `rowing` (máquina de remo) es cardio.
// `run` queda fuera a propósito (F142): solo `running`/`treadmill` son cardio; el
// empuje de pecho con “salida corriendo” es fuerza. `jump`/`ski` siguen marcando
// cardio salvo la excepción de flexión con salto de abajo.
const CARDIO_RE =
  /\b(cardio|running|jog|rowing|bike|bicycle|cycling|jump|burpee|ski|swim|treadmill|elliptical|stair|stepper|cardio)\b|cardio|aerobic|hiit|sprint|jumping|assault|skier/i

// F142 — un empuje/flexión de pecho es fuerza aunque el nombre traiga “release”
// (que el patrón de estiramientos confundía) o “salto” (componente pliométrico).
// Los saltos de pierna/glúteo no matchean este patrón y siguen cardio.
const PUSH_STRENGTH_RE = /\b(chest[-_ ]?push|push[-_ ]?ups?)\b|empuje de pecho/i

const MOBILITY_RE =
  /\b(mobility|movilidad|mobility drill)\b|movilidad|mobility/i

const STRETCH_RE =
  /\b(stretch|stretching|smr|foam|roll|roller|flexibility|yoga|flexib|psoas|calves stretch|quad stretch|hamstring stretch)\b|estiramiento|estiramientos|flexibil|tibialis-smr|release/i

// El catálogo externo no siempre trae categoría: se deduce con palabras clave sobre nombre, slug e id.
export const detectCategory = (
  name: string,
  slug: string,
  externalId?: string
): ExerciseCategory => {
  const haystack = `${name} ${slug} ${externalId ?? ''}`
  if (PUSH_STRENGTH_RE.test(haystack)) return 'strength'
  if (CARDIO_RE.test(haystack)) return 'cardio'
  if (MOBILITY_RE.test(haystack)) return 'mobility'
  if (STRETCH_RE.test(haystack)) return 'stretch'
  return 'strength'
}

// Rellena la categoría faltante de un ejercicio con la detección heurística.
export const withCategory = (ex: Exercise): Exercise => ({
  ...ex,
  category: ex.category ?? detectCategory(ex.name, ex.slug, ex.externalId),
})

// El cardio se decide por la categoría real del ejercicio en el catálogo, nunca por
// tener duración: plancha, estiramientos y movilidad también se miden en segundos.
export const isCardioCategory = (category?: ExerciseCategory): boolean => category === 'cardio'
