// Garantiza que TODO ejercicio del catálogo tiene técnica: pasos propios, pasos
// derivados por plantilla de instrucción o fallback de instrucciones no vacío,
// tanto en ES como en EN (la ficha cae a fallback si no hay pasos).
import { describe, expect, it } from 'vitest'
import { seedExercises } from '@/data/seed/exercises'
import { seedExercisesExtra } from '@/data/seed/exercisesExtra'
import { STEPS_BY_INSTRUCTION } from '@/i18n/catalog/exerciseSteps'
import { STEPS_BY_INSTRUCTION_EN } from '@/i18n/catalog/exerciseStepsEn'
import { localizeExerciseDetail } from '@/i18n/catalog/en'
import type { Exercise } from '@/domain/types'

const ALL: Exercise[] = [...seedExercises, ...seedExercisesExtra]

const hasStepsOrFallback = (ex: Exercise): boolean => {
  const derived = STEPS_BY_INSTRUCTION[ex.instructions]
  const steps = ex.detailedSteps ?? derived
  if (steps && steps.length > 0) return true
  return ex.instructions.trim().length > 0
}

describe('cobertura de técnica de todos los ejercicios', () => {
  it('el catálogo completo (seed + extra) tiene pasos o instrucción de fallback en ES', () => {
    const sinTecnica = ALL.filter((ex) => !hasStepsOrFallback(ex))
    expect(sinTecnica).toEqual([])
  })

  it('el catálogo completo tiene técnica en EN vía localizeExerciseDetail', () => {
    const sinEn = ALL.filter((ex) => {
      const localized = localizeExerciseDetail(ex, 'en')
      const steps = localized.detailedSteps
      if (steps && steps.length > 0) return false
      return localized.instructions.trim().length === 0
    })
    expect(sinEn).toEqual([])
  })

  it('toda clave de plantilla ES tiene su traducción EN equivalente', () => {
    const sinEn = Object.keys(STEPS_BY_INSTRUCTION).filter(
      (k) => !STEPS_BY_INSTRUCTION_EN[k],
    )
    expect(sinEn).toEqual([])
  })

  it('los pasos derivados tienen 2-6 pasos con step correlativo y texto no vacío', () => {
    for (const [inst, steps] of Object.entries(STEPS_BY_INSTRUCTION)) {
      expect(steps.length).toBeGreaterThanOrEqual(2)
      expect(steps.length).toBeLessThanOrEqual(6)
      steps.forEach((s, i) => expect(s.step).toBe(i + 1))
      expect(steps.every((s) => s.instruction.trim().length > 0)).toBe(true)
      expect(inst.trim().length).toBeGreaterThan(0)
    }
  })

  it('cada plantilla derivada tiene al menos un tip o warning (ES)', () => {
    for (const [inst, steps] of Object.entries(STEPS_BY_INSTRUCTION)) {
      expect(
        steps.some((s) => (s.tip?.trim().length ?? 0) > 0 || (s.warning?.trim().length ?? 0) > 0),
        `plantilla sin tip/warning: ${inst}`,
      ).toBe(true)
    }
  })

  it('cada plantilla derivada tiene al menos un tip o warning (EN)', () => {
    for (const [inst, steps] of Object.entries(STEPS_BY_INSTRUCTION_EN)) {
      expect(
        steps.some((s) => (s.tip?.trim().length ?? 0) > 0 || (s.warning?.trim().length ?? 0) > 0),
        `plantilla EN sin tip/warning: ${inst}`,
      ).toBe(true)
    }
  })
})
