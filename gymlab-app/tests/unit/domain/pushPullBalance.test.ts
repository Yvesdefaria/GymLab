// Tests de balance push/pull/pierna (F74).
import { describe, it, expect } from 'vitest'
import {
  classifyMuscle,
  calculatePushPullVolume,
  calculatePushPullPercentages,
  detectImbalance,
} from '@/domain/pushPullBalance'
import type { MuscleGroup } from '@/domain/types'

// ─── classifyMuscle ───────────────────────────────────────────

describe('classifyMuscle', () => {
  const push: MuscleGroup[] = ['pecho', 'triceps', 'hombro']
  const pull: MuscleGroup[] = ['espalda', 'biceps', 'trapecios', 'antebrazo']
  const legs: MuscleGroup[] = ['pierna', 'gluteo', 'abdomen']

  it.each(push)('classifyMuscle(%s) → push', (m) => {
    expect(classifyMuscle(m)).toBe('push')
  })

  it.each(pull)('classifyMuscle(%s) → pull', (m) => {
    expect(classifyMuscle(m)).toBe('pull')
  })

  it.each(legs)('classifyMuscle(%s) → legs', (m) => {
    expect(classifyMuscle(m)).toBe('legs')
  })
})

// ─── calculatePushPullVolume ───────────────────────────────────

describe('calculatePushPullVolume', () => {
  it('retorna ceros si input vacío', () => {
    expect(calculatePushPullVolume({})).toEqual({ push: 0, pull: 0, legs: 0 })
  })

  it('agrega volumen push correctamente (pecho + triceps)', () => {
    const result = calculatePushPullVolume({ pecho: 100, triceps: 50 })
    expect(result.push).toBe(150)
    expect(result.pull).toBe(0)
    expect(result.legs).toBe(0)
  })

  it('agrega volumen pull correctamente (espalda + biceps)', () => {
    const result = calculatePushPullVolume({ espalda: 200, biceps: 80 })
    expect(result.push).toBe(0)
    expect(result.pull).toBe(280)
    expect(result.legs).toBe(0)
  })

  it('agrega volumen legs correctamente (pierna + gluteo)', () => {
    const result = calculatePushPullVolume({ pierna: 300, gluteo: 120 })
    expect(result.push).toBe(0)
    expect(result.pull).toBe(0)
    expect(result.legs).toBe(420)
  })

  it('agrega todos los grupos correctamente', () => {
    const result = calculatePushPullVolume({
      pecho: 100,
      espalda: 200,
      pierna: 300,
      biceps: 50,
      triceps: 30,
      gluteo: 80,
    })
    expect(result.push).toBe(130)  // pecho 100 + triceps 30
    expect(result.pull).toBe(250)  // espalda 200 + biceps 50
    expect(result.legs).toBe(380)  // pierna 300 + gluteo 80
  })

  it('ignora grupos musculares no definidos en MUSCLE_TO_CATEGORY', () => {
    // El dominio usa `if (cat)` — si el grupo no está, se ignora silenciosamente
    const result = calculatePushPullVolume({ pecho: 100 } as any)
    expect(result.push).toBe(100)
  })
})

// ─── calculatePushPullPercentages ──────────────────────────────

describe('calculatePushPullPercentages', () => {
  it('retorna 33.3% cada uno si volumen total es cero', () => {
    const result = calculatePushPullPercentages({ push: 0, pull: 0, legs: 0 })
    expect(result.push).toBeCloseTo(33.3, 1)
    expect(result.pull).toBeCloseTo(33.3, 1)
    expect(result.legs).toBeCloseTo(33.3, 1)
  })

  it('calcula porcentajes correctamente', () => {
    // push=50, pull=30, legs=20 → total=100
    const result = calculatePushPullPercentages({ push: 50, pull: 30, legs: 20 })
    expect(result.push).toBeCloseTo(50, 1)
    expect(result.pull).toBeCloseTo(30, 1)
    expect(result.legs).toBeCloseTo(20, 1)
  })

  it('maneja distribución desigual extrema', () => {
    // push=90, pull=5, legs=5 → total=100
    const result = calculatePushPullPercentages({ push: 90, pull: 5, legs: 5 })
    expect(result.push).toBeCloseTo(90, 0)
    expect(result.pull).toBeCloseTo(5, 0)
    expect(result.legs).toBeCloseTo(5, 0)
  })

  it('porcentajes suman ~100%', () => {
    const result = calculatePushPullPercentages({ push: 33, pull: 33, legs: 34 })
    const total = result.push + result.pull + result.legs
    expect(total).toBeCloseTo(100, 0)
  })
})

// ─── detectImbalance ───────────────────────────────────────────

describe('detectImbalance', () => {
  it('balanced si diferencia ≤20%', () => {
    // push=40, pull=30 → diff=10
    expect(detectImbalance({ push: 40, pull: 30, legs: 30 })).toEqual({
      balanced: true,
      alert: null,
    })
  })

  it('balanced si diferencia exactamente 20%', () => {
    // push=50, pull=30 → diff=20
    expect(detectImbalance({ push: 50, pull: 30, legs: 20 })).toEqual({
      balanced: true,
      alert: null,
    })
  })

  it('imbalanced si diferencia >20%', () => {
    // push=60, pull=30 → diff=30
    const result = detectImbalance({ push: 60, pull: 30, legs: 10 })
    expect(result.balanced).toBe(false)
    expect(result.alert).toContain('60%')
    expect(result.alert).toContain('30%')
  })

  it('alert contiene formato "Push X% vs Pull Y%"', () => {
    const result = detectImbalance({ push: 70, pull: 20, legs: 10 })
    expect(result.alert).toMatch(/^Push \d+% vs Pull \d+%$/)
  })

  it('imbalanced cuando pull >> push', () => {
    // pull=70, push=20 → diff=50
    const result = detectImbalance({ push: 20, pull: 70, legs: 10 })
    expect(result.balanced).toBe(false)
    expect(result.alert).toContain('20%')
    expect(result.alert).toContain('70%')
  })
})

// ─── Integración completa ──────────────────────────────────────

describe('integración: pipeline completo', () => {
  it('de volumeByMuscle a detectImbalance', () => {
    const input: Partial<Record<MuscleGroup, number>> = {
      pecho: 100,
      espalda: 60,
      pierna: 80,
    }
    const volume = calculatePushPullVolume(input)
    const pct = calculatePushPullPercentages(volume)
    const { balanced } = detectImbalance(pct)
    // push=100, pull=60, legs=80 → push%=45.5, pull%=27.3 → diff=18.2 → balanced
    expect(balanced).toBe(true)
  })

  it('detecta desequilibrio con pecho mucho más que espalda', () => {
    const input: Partial<Record<MuscleGroup, number>> = {
      pecho: 300,
      espalda: 50,
    }
    const volume = calculatePushPullVolume(input)
    const pct = calculatePushPullPercentages(volume)
    const { balanced, alert } = detectImbalance(pct)
    // push=300, pull=50, legs=0 → push%=85.7, pull%=14.3 → diff=71.4 → imbalanced
    expect(balanced).toBe(false)
    expect(alert).toBeTruthy()
  })

  it('caso vacío retorna balanced (33/33/33)', () => {
    const volume = calculatePushPullVolume({})
    const pct = calculatePushPullPercentages(volume)
    const { balanced } = detectImbalance(pct)
    expect(balanced).toBe(true)
  })
})
