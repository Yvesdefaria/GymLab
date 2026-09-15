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

  // Regresión: durationSeconds es un campo de cardio. Las plantillas lo asignaban
  // también a ejercicios de repeticiones y al guardar quedaban marcados como cardio.
  describe('durationSeconds solo en ejercicios por tiempo', () => {
    const durationOf = (templateId: string, exerciseId: number): number | undefined => {
      const tpl = quickTemplates.find((t) => t.id === templateId)
      return tpl?.exercises.find((e) => e.exerciseId === exerciseId)?.durationSeconds
    }

    it('no lo asigna a ejercicios de reps (flexiones, sentadillas, zancadas, abdominales, elevaciones)', () => {
      const repsEntries = [
        ['full-body-express', 42], // flexiones
        ['full-body-express', 1086], // sentadillas
        ['full-body-express', 32], // zancadas
        ['core-express', 1006], // abdominales bicicleta
        ['core-express', 1625], // elevaciones laterales de pierna (versión reps)
      ] as const
      for (const [tplId, exId] of repsEntries) {
        expect(durationOf(tplId, exId), `${tplId} → ejercicio ${exId}`).toBeUndefined()
      }
    })

    it('lo mantiene en ejercicios por tiempo (plancha, estiramientos, movilidad)', () => {
      expect(durationOf('full-body-express', 36)).toBeGreaterThan(0) // plancha
      expect(durationOf('full-body-stretch', 1007)).toBeGreaterThan(0) // estiramiento cuádriceps
      expect(durationOf('pre-sleep-stretch', 1541)).toBeGreaterThan(0) // piernas arriba
      expect(durationOf('joint-mobility', 1625)).toBeGreaterThan(0) // elevaciones en movilidad
      expect(durationOf('joint-mobility', 1814)).toBeGreaterThan(0) // círculos de muñeca
    })
  })
})
