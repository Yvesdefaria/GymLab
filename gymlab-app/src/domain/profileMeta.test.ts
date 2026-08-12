// Tests del dominio de meta del perfil: claves y objetivo semanal.
import { describe, expect, it } from 'vitest'
import { BIRTH_DATE_KEY, BODY_SEX_KEY, HEIGHT_KEY, weeklyGoalFromDays } from './profileMeta'

describe('profileMeta', () => {
  it('expone las claves de meta del perfil', () => {
    expect(HEIGHT_KEY).toBe('heightCm')
    expect(BODY_SEX_KEY).toBe('bodySex')
    expect(BIRTH_DATE_KEY).toBe('birthDate')
  })

  describe('weeklyGoalFromDays', () => {
    it('mapea días/semana del onboarding al objetivo semanal', () => {
      expect(weeklyGoalFromDays(2)).toBe(2)
      expect(weeklyGoalFromDays(3)).toBe(3)
      expect(weeklyGoalFromDays(4)).toBe(4)
      expect(weeklyGoalFromDays(5)).toBe(5)
    })

    it('acota valores fuera del rango plausible', () => {
      expect(weeklyGoalFromDays(0)).toBe(1)
      expect(weeklyGoalFromDays(-3)).toBe(1)
      expect(weeklyGoalFromDays(7)).toBe(5)
      expect(weeklyGoalFromDays(Number.NaN)).toBe(1)
    })
  })
})
