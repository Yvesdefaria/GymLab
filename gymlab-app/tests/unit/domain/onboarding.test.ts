// Tests del prefill del planificador desde el blob de onboarding (S2).
// Convención del repo: lógica pura en domain, glue React/Dexie por build + e2e.
import { describe, expect, it } from 'vitest'
import { ONBOARDING_DAYS_OPTIONS, plannerPrefillFromAnswers } from '@/domain/onboarding'

describe('ONBOARDING_DAYS_OPTIONS', () => {
  it('expone los días por semana que ofrece el onboarding', () => {
    expect(ONBOARDING_DAYS_OPTIONS).toEqual([2, 3, 4, 5])
  })
})

describe('plannerPrefillFromAnswers', () => {
  it('sin respuestas guardadas no precarga nada', () => {
    expect(plannerPrefillFromAnswers(null)).toEqual({})
    expect(plannerPrefillFromAnswers(undefined)).toEqual({})
    expect(plannerPrefillFromAnswers({})).toEqual({})
  })

  it('mapea objetivo, nivel, días y duración válidos', () => {
    expect(
      plannerPrefillFromAnswers({
        objective: 'fuerza',
        level: 'intermedio',
        daysPerWeek: 4,
        sessionDurationMin: 45,
      }),
    ).toEqual({
      objective: 'fuerza',
      level: 'intermedio',
      daysPerWeek: 4,
      sessionDurationMin: 45,
    })
  })

  it('ignora valores inválidos y conserva solo los válidos', () => {
    expect(
      plannerPrefillFromAnswers({
        objective: 'cardio' as never,
        level: 'experto' as never,
        daysPerWeek: 7,
        sessionDurationMin: Number.NaN,
      }),
    ).toEqual({})

    expect(
      plannerPrefillFromAnswers({
        objective: 'volumen',
        level: 'experto' as never,
        daysPerWeek: 3,
        sessionDurationMin: 90,
      }),
    ).toEqual({
      objective: 'volumen',
      daysPerWeek: 3,
      sessionDurationMin: 90,
    })
  })
})
