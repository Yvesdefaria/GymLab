// Tests del dominio de meta del perfil: claves, nombre (S1) y objetivo semanal.
import { describe, expect, it } from 'vitest'
import {
  BIRTH_DATE_KEY,
  BODY_SEX_KEY,
  HEIGHT_KEY,
  NAME_MAX_LENGTH,
  PROFILE_NAME_KEY,
  calculatorSexFromBodySex,
  isProfileNameValid,
  normalizeProfileName,
  weeklyGoalFromDays,
} from '@/domain/profileMeta'

describe('profileMeta', () => {
  it('expone las claves de meta del perfil', () => {
    expect(HEIGHT_KEY).toBe('heightCm')
    expect(BODY_SEX_KEY).toBe('bodySex')
    expect(BIRTH_DATE_KEY).toBe('birthDate')
    expect(PROFILE_NAME_KEY).toBe('profileName')
  })

  describe('normalizeProfileName', () => {
    it('recorta espacios y limita a 24 caracteres', () => {
      expect(normalizeProfileName('  Ana  ')).toBe('Ana')
      expect(normalizeProfileName('x'.repeat(40))).toHaveLength(NAME_MAX_LENGTH)
    })
  })

  describe('isProfileNameValid', () => {
    it('exige al menos un carácter visible', () => {
      expect(isProfileNameValid('')).toBe(false)
      expect(isProfileNameValid('   ')).toBe(false)
      expect(isProfileNameValid('Ana')).toBe(true)
    })
  })

  describe('calculatorSexFromBodySex', () => {
    it('mapea el sexo del perfil al vocabulario de las calculadoras', () => {
      expect(calculatorSexFromBodySex('female')).toBe('mujer')
      expect(calculatorSexFromBodySex('male')).toBe('hombre')
      expect(calculatorSexFromBodySex(null)).toBe('hombre')
      expect(calculatorSexFromBodySex(undefined)).toBe('hombre')
    })
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
