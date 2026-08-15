// Detección heurística de la categoría de un ejercicio (cardio/movilidad/estiramiento/fuerza) por su nombre.
import type { Exercise, ExerciseCategory } from './types'

const CARDIO_RE =
  /\b(cardio|running|run|jog|row|rowing|bike|bicycle|cycling|jump|burpee|ski|swim|treadmill|elliptical|stair|stepper|cardio)\b|cardio|aerobic|hiit|sprint|jumping|assault|skier/i

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
