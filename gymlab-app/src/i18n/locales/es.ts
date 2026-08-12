// Catalogo de cadenas en espanol (es-ES). Es la fuente de claves: `en` debe
// replicar exactamente esta estructura (se comprueba por tipos en en.ts).
export const es = {
  seo: {
    titleDefault: 'GymLab — Entrena mejor con datos',
  },
  app: {
    loading: 'Cargando GymLab...',
  },
  settings: {
    language: 'Idioma',
    languageHint: 'Idioma de la interfaz y de los catalogos.',
  },
} as const

// Ancha los literales de `es` a `string` para tipar `en` solo por estructura.
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>
}

export type EsSchema = DeepStringify<typeof es>
