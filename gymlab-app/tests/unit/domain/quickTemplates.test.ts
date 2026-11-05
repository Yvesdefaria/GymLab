/**
 * Tests del dominio de plantillas de sesión rápida (QuickTemplates, F65/F93 #22).
 *
 * Verifica que cada plantilla referencia ejercicios REALES del catálogo
 * (exerciseId > 0) en lugar de ids sintéticos negativos, para que la sesión
 * activa pueda resolver la ficha/técnica y contabilizar en estadísticas.
 */
import { describe, expect, it } from 'vitest'
import { seedExercises } from '@/data/seed/exercises'
import { seedExercisesExtra } from '@/data/seed/exercisesExtra'
import { quickTemplates, templateCategories } from '@/domain/quickTemplates'
import type { QuickTemplateCategory } from '@/domain/quickTemplates'

// F139.14: el nombre/descripción de cada entrada debe describir el ejercicio real.
// El mapa fija template + nameKey → slug del catálogo (seed curado + ampliado).
const CATALOG_SLUGS = new Map(
  [...seedExercises, ...seedExercisesExtra].map((exercise) => [exercise.id, exercise.slug]),
)

const EXPECTED_SLUGS: Record<string, Record<string, string>> = {
  'full-body-express': {
    'quickTemplates.exercises.pushups': 'flexiones',
    'quickTemplates.exercises.squats': 'bodyweight-squat',
    'quickTemplates.exercises.plank': 'plancha',
    'quickTemplates.exercises.lunges': 'zancadas',
    'quickTemplates.exercises.starJump': 'star-jump',
    'quickTemplates.exercises.mountainClimbers': 'mountain-climbers',
  },
  'core-express': {
    'quickTemplates.exercises.plank': 'plancha',
    'quickTemplates.exercises.bicycleCrunches': 'air-bike',
    'quickTemplates.exercises.sideLegRaises': 'side-leg-raises',
    'quickTemplates.exercises.mountainClimbers': 'mountain-climbers',
  },
  'full-body-stretch': {
    'quickTemplates.exercises.quadStretch': 'all-fours-quad-stretch',
    'quickTemplates.exercises.hamstringStretch': '90-90-hamstring',
    'quickTemplates.exercises.chestOpener': 'behind-head-chest-stretch',
    'quickTemplates.exercises.childPose': 'childs-pose',
    'quickTemplates.exercises.neckRoll': 'chin-to-chest-stretch',
  },
  'pre-sleep-stretch': {
    'quickTemplates.exercises.supineTwist': 'lying-crossover',
    'quickTemplates.exercises.childPose': 'childs-pose',
    'quickTemplates.exercises.catCow': 'cat-stretch',
    'quickTemplates.exercises.legsUp': 'leg-up-hamstring-stretch',
  },
  'joint-mobility': {
    'quickTemplates.exercises.ankleCircles': 'ankle-circles',
    'quickTemplates.exercises.hipCircles': 'standing-hip-circles',
    'quickTemplates.exercises.shoulderCircles': 'shoulder-circles',
    'quickTemplates.exercises.wristsCircles': 'wrist-circles',
    'quickTemplates.exercises.neckRoll': 'chin-to-chest-stretch',
  },
}

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

  it('cada entrada apunta al ejercicio del catálogo que describe', () => {
    for (const tpl of quickTemplates) {
      const expected = EXPECTED_SLUGS[tpl.id]
      expect(expected, `plantilla ${tpl.id} sin mapa de slugs`).toBeDefined()
      for (const ex of tpl.exercises) {
        const slug = expected[ex.nameKey]
        expect(slug, `${tpl.id} → ${ex.nameKey} sin slug esperado`).toBeDefined()
        expect(CATALOG_SLUGS.get(ex.exerciseId), `${tpl.id} → ${ex.nameKey}`).toBe(slug)
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
      expect(durationOf('pre-sleep-stretch', 1383)).toBeGreaterThan(0) // estiramiento de isquiotibial
      expect(durationOf('joint-mobility', 1617)).toBeGreaterThan(0) // círculos de hombro
      expect(durationOf('joint-mobility', 1814)).toBeGreaterThan(0) // círculos de muñeca
    })
  })
})
