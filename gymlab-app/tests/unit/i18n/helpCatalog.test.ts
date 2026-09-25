// Integridad del catálogo central de ayudas (F90): cada id debe resolver
// label/body no vacíos en es y en (la paridad de claves la exige el compilador;
// esto valida además que el contenido no quede vacío).
import { describe, expect, it } from 'vitest'
import { HELP, HELP_IDS } from '@/i18n/help'
import { es } from '@/i18n/locales/es'
import { en } from '@/i18n/locales/en'

const getByPath = (obj: unknown, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined),
      obj,
    )

describe('catálogo de ayudas', () => {
  it.each(HELP_IDS)('«%s» tiene label y body no vacíos en es y en', (id) => {
    for (const locale of [es, en]) {
      for (const kind of ['label', 'body'] as const) {
        const value = getByPath(locale, HELP[id][kind])
        expect(typeof value).toBe('string')
        expect((value as string).trim().length).toBeGreaterThan(0)
      }
    }
  })
})
