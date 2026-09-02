/**
 * Tests del dominio de plantillas de sesión rápida (QuickTemplates, F65/F93 #22).
 *
 * Verifica que cada plantilla referencia ejercicios REALES del catálogo
 * (exerciseId > 0) en lugar de ids sintéticos negativos, para que la sesión
 * activa pueda resolver la ficha/técnica y contabilizar en estadísticas.
 */
import { describe, expect, it } from 'vitest'
import { quickTemplates, templateCategories } from '@/domain/quickTemplates'
import type { QuickTemplateCategory } from '@/domain/quickTemplates'

describe('quickTemplates', () => {
  it('define al menos una plantilla', () => {
    expect(quickTemplates.length).toBeGreaterThan(0)
  })

  it('cada plantilla referencia ejercicios REALES del catálogo (exerciseId > 0)', () => {
    for (const tpl of quickTemplates) {
      expect(tpl.exercises.length, `plantilla ${tpl.id} sin ejercicios`).toBeGreaterThan(0)
      for (const ex of tpl.exercises) {
        expect(ex.exerciseId, `${tpl.id} → ${ex.nameKey} usa id no real ${ex.exerciseId}`)
          .toBeGreaterThan(0)
      }
    }
  })

  it('cubre las 3 categorías de sesión rápida', () => {
    const cats = new Set<QuickTemplateCategory>(quickTemplates.map((t) => t.category))
    for (const cat of templateCategories) {
      expect(cats.has(cat.key), `categoría ${cat.key} sin plantilla`).toBe(true)
    }
  })

  it('no usa ids sintéticos negativos (regresión de #22)', () => {
    const allIds = quickTemplates.flatMap((t) => t.exercises.map((e) => e.exerciseId))
    expect(allIds.every((id) => id > 0)).toBe(true)
  })
})
