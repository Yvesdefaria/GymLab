import { describe, expect, it } from 'vitest'
import { SECTION_TIPS, TOUR_STEPS } from '@/i18n/tour'
import { SECTION_IDS } from '@/domain/tour'
import { es } from '@/i18n/locales/es'
import { en } from '@/i18n/locales/en'

const getByPath = (obj: unknown, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined),
      obj,
    )

describe('catálogo del tour', () => {
  it('cada paso tiene id único, ruta absoluta y copy no vacío en es y en', () => {
    const ids = new Set(TOUR_STEPS.map((s) => s.id))
    expect(ids.size).toBe(TOUR_STEPS.length)
    for (const step of TOUR_STEPS) {
      expect(step.route.startsWith('/')).toBe(true)
      for (const locale of [es, en]) {
        const value = getByPath(locale, step.bodyKey)
        expect(typeof value).toBe('string')
        expect((value as string).trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('todas las secciones con tip tienen copy no vacío en es y en', () => {
    for (const id of SECTION_IDS) {
      for (const locale of [es, en]) {
        const value = getByPath(locale, SECTION_TIPS[id].bodyKey)
        expect(typeof value).toBe('string')
        expect((value as string).trim().length).toBeGreaterThan(0)
      }
    }
  })
})
