// Tests del reto diario de pasos (F84e): progreso contra la meta del día.
import { describe, expect, it } from 'vitest'
import { getDailyStepChallenge, STEP_CHALLENGE_ID } from '@/domain/challenges'

describe('getDailyStepChallenge', () => {
  it('STEP_CHALLENGE_ID identifica el reto «Camina 10k»', () => {
    expect(STEP_CHALLENGE_ID).toBe('pasos-10k')
  })

  it('sin pasos no completa y muestra 0 contra la meta', () => {
    const p = getDailyStepChallenge(0, 10_000)
    expect(p.challengeId).toBe(STEP_CHALLENGE_ID)
    expect(p.current).toBe(0)
    expect(p.target).toBe(10_000)
    expect(p.completed).toBe(false)
  })

  it('por debajo de la meta muestra los pasos reales sin completar', () => {
    const p = getDailyStepChallenge(7_000, 10_000)
    expect(p.current).toBe(7_000)
    expect(p.completed).toBe(false)
  })

  it('alcanzar la meta completa el reto', () => {
    const p = getDailyStepChallenge(10_000, 10_000)
    expect(p.current).toBe(10_000)
    expect(p.completed).toBe(true)
  })

  it('superar la meta completa y clampa el progreso al target', () => {
    const p = getDailyStepChallenge(14_532, 10_000)
    expect(p.current).toBe(10_000)
    expect(p.target).toBe(10_000)
    expect(p.completed).toBe(true)
  })

  it('respeta la meta del usuario (meta distinta de 10k)', () => {
    const p = getDailyStepChallenge(8_000, 8_000)
    expect(p.target).toBe(8_000)
    expect(p.current).toBe(8_000)
    expect(p.completed).toBe(true)
  })
})