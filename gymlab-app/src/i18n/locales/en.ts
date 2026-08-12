// Traducción al inglés (en). Tipada contra `es` para que falte cualquier clave
// y el typecheck lo detenga (paridad es↔en garantizada en compilación).
import type { EsSchema } from './es'

export const en: EsSchema = {
  seo: {
    titleDefault: 'GymLab — Train better with data',
  },
  app: {
    loading: 'Loading GymLab...',
  },
  settings: {
    language: 'Language',
    languageHint: 'Language of the interface and catalogs.',
  },
}
