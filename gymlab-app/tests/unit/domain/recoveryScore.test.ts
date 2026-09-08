// Tests del score de recuperación (cálculo, clasificación y redistribución de factores).
import { describe, expect, it } from 'vitest'
import { computeRecoveryScore, stepsScore, W_STEPS } from '@/domain/recoveryScore'

describe('computeRecoveryScore', () => {
  it('devuelve score 0 y rest sin datos', () => {
    const r = computeRecoveryScore({
      daysSinceLastWorkout: null,
      sleep: null,
      soreness: null,
      currentStreak: 0,
    })
    expect(r.score).toBe(0)
    expect(r.classification).toBe('rest')
  })

  it('clasifica ready ≥ 70', () => {
    const r = computeRecoveryScore({
      daysSinceLastWorkout: 0,
      sleep: 5,
      soreness: 5,
      currentStreak: 7,
    })
    expect(r.score).toBeGreaterThanOrEqual(70)
    expect(r.classification).toBe('ready')
  })

  it('clasifica maybe entre 40 y 69', () => {
    const r = computeRecoveryScore({
      daysSinceLastWorkout: 4,
      sleep: 3,
      soreness: 3,
      currentStreak: 2,
    })
    expect(r.score).toBeGreaterThanOrEqual(40)
    expect(r.score).toBeLessThan(70)
    expect(r.classification).toBe('maybe')
  })

  it('clasifica rest < 40', () => {
    const r = computeRecoveryScore({
      daysSinceLastWorkout: 7,
      sleep: 1,
      soreness: 1,
      currentStreak: 0,
    })
    expect(r.score).toBeLessThan(40)
    expect(r.classification).toBe('rest')
  })

  it('redistribuye pesos cuando faltan factores', () => {
    const conTodos = computeRecoveryScore({
      daysSinceLastWorkout: 3,
      sleep: 4,
      soreness: 4,
      currentStreak: 3,
    })
    const sinSueno = computeRecoveryScore({
      daysSinceLastWorkout: 3,
      sleep: null,
      soreness: 4,
      currentStreak: 3,
    })
    // Sin sueño, el peso se redistribuye entre los demás factores.
    // El score sin sueño puede ser distinto del completo.
    expect(sinSueno.score).not.toBe(conTodos.score)
  })

  it('daysSinceLastWorkout 0 = score máximo de días', () => {
    const r = computeRecoveryScore({
      daysSinceLastWorkout: 0,
      sleep: null,
      soreness: null,
      currentStreak: 0,
    })
    // 0 días → díasScore = 100; con solo el factor días (peso redistribuido = 1.0)
    expect(r.breakdown.daysSince).toBe(100)
  })

  it('7+ días sin entrenar = score 0 de días', () => {
    const r = computeRecoveryScore({
      daysSinceLastWorkout: 7,
      sleep: null,
      soreness: null,
      currentStreak: 0,
    })
    expect(r.breakdown.daysSince).toBe(0)
  })

  it('sleep 5 = 100, sleep 1 = 0', () => {
    const high = computeRecoveryScore({
      daysSinceLastWorkout: null,
      sleep: 5,
      soreness: null,
      currentStreak: 0,
    })
    const low = computeRecoveryScore({
      daysSinceLastWorkout: null,
      sleep: 1,
      soreness: null,
      currentStreak: 0,
    })
    expect(high.breakdown.sleep).toBe(100)
    expect(low.breakdown.sleep).toBe(0)
  })

  it('soreness 5 (sin dolor) = 100, soreness 1 (mucho dolor) = 0', () => {
    const high = computeRecoveryScore({
      daysSinceLastWorkout: null,
      sleep: null,
      soreness: 5,
      currentStreak: 0,
    })
    const low = computeRecoveryScore({
      daysSinceLastWorkout: null,
      sleep: null,
      soreness: 1,
      currentStreak: 0,
    })
    expect(high.breakdown.soreness).toBe(100)
    expect(low.breakdown.soreness).toBe(0)
  })

  it('streak 7+ = 100, streak 0 = 0', () => {
    // Necesita al menos un factor distinto de null para no entrar en el early return
    const high = computeRecoveryScore({
      daysSinceLastWorkout: 3,
      sleep: null,
      soreness: null,
      currentStreak: 7,
    })
    const low = computeRecoveryScore({
      daysSinceLastWorkout: 3,
      sleep: null,
      soreness: null,
      currentStreak: 0,
    })
    expect(high.breakdown.streak).toBe(100)
    expect(low.breakdown.streak).toBe(0)
  })

  it('score siempre entre 0 y 100', () => {
    const inputs = [
      { daysSinceLastWorkout: 0, sleep: 5, soreness: 5, currentStreak: 7 },
      { daysSinceLastWorkout: 7, sleep: 1, soreness: 1, currentStreak: 0 },
      { daysSinceLastWorkout: 3, sleep: 3, soreness: 3, currentStreak: 3 },
      { daysSinceLastWorkout: null, sleep: null, soreness: null, currentStreak: 0 },
    ]
    for (const input of inputs) {
      const r = computeRecoveryScore(input)
      expect(r.score).toBeGreaterThanOrEqual(0)
      expect(r.score).toBeLessThanOrEqual(100)
    }
  })
})

describe('computeRecoveryScore · factor de actividad (pasos)', () => {
  const base = { daysSinceLastWorkout: 3, sleep: 4, soreness: 4, currentStreak: 3 }

  it('activityRatio 1 (meta cumplida) sube el score respecto a sin datos de pasos', () => {
    const sinPasos = computeRecoveryScore(base)
    const conPasos = computeRecoveryScore({ ...base, activityRatio: 1 })
    expect(sinPasos.score).toBe(63)
    expect(conPasos.score).toBeGreaterThan(sinPasos.score)
    expect(conPasos.score).toBe(68)
  })

  it('activityRatio 0 (ningún paso registrado) baja el score', () => {
    const sinPasos = computeRecoveryScore(base)
    const ceroPasos = computeRecoveryScore({ ...base, activityRatio: 0 })
    expect(ceroPasos.score).toBeLessThan(sinPasos.score)
    expect(ceroPasos.score).toBe(55)
  })

  it('activityRatio null se trata como ausente: score idéntico y sin activity en breakdown', () => {
    const sinPasos = computeRecoveryScore(base)
    const conNull = computeRecoveryScore({ ...base, activityRatio: null })
    expect(conNull.score).toBe(sinPasos.score)
    expect(conNull.classification).toBe(sinPasos.classification)
    expect('activity' in conNull.breakdown).toBe(false)
  })

  it('con solo activityRatio calcula score (no entra en el early return sin datos)', () => {
    const r = computeRecoveryScore({
      daysSinceLastWorkout: null,
      sleep: null,
      soreness: null,
      currentStreak: 0,
      activityRatio: 1,
    })
    // totalWeight = W_STREAK + W_STEPS = 0.3; numerator = 100 * W_STEPS = 15 → 50
    expect(r.score).toBe(50)
    expect(r.classification).toBe('maybe')
  })

  it('breakdown.activity = Math.round(stepsScore(ratio)) cuando está presente', () => {
    const r = computeRecoveryScore({ ...base, activityRatio: 0.5 })
    expect(r.breakdown.activity).toBe(50)
  })

  it('stepsScore: 0→0, 0.5→50, 1→100 y clampa ratios > 1 a 100', () => {
    expect(stepsScore(0)).toBe(0)
    expect(stepsScore(0.5)).toBe(50)
    expect(stepsScore(1)).toBe(100)
    expect(stepsScore(1.6)).toBe(100)
  })

  it('W_STEPS pesa 0.15 y es el único factor de actividad', () => {
    expect(W_STEPS).toBe(0.15)
  })
})
