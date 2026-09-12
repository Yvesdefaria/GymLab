// Tests del motor de sugerencias de sesión ampliado (F63): acciones aplicables y calentamiento.
import { describe, expect, it } from 'vitest'
import {
  generateSuggestions,
  WARMUP_E1RM_THRESHOLD,
  WARMUP_WEIGHT_RATIO,
  type ActiveSetInput,
  type CompletedSet,
} from '@/domain/sessionSuggestions'

// Serie completada con valores por defecto razonables.
const completed = (
  exerciseId: number,
  weightKg: number,
  reps: number,
  rpe = 7,
  rir = 2,
  setNumber = 1
): CompletedSet => ({ exerciseId, weightKg, reps, rpe, rir, setNumber })

// Serie activa (completada o pendiente) para el trigger de calentamiento.
const active = (
  exerciseId: number,
  weightKg: number,
  setNumber: number,
  isWarmup = false,
  completedFlag = false
): ActiveSetInput => ({ exerciseId, weightKg, isWarmup, completed: completedFlag, setNumber })

describe('generateSuggestions — acciones de peso', () => {
  it('la sugerencia increase lleva action applyWeight +2.5', () => {
    const result = generateSuggestions([
      completed(1, 60, 8, 5, 3, 1),
      completed(1, 60, 8, 5, 3, 2),
    ])
    const s = result.find((x) => x.id === 'increase-1')
    expect(s?.type).toBe('increase')
    expect(s?.action).toEqual({ kind: 'applyWeight', amountKg: 2.5 })
  })

  it('la sugerencia decrease lleva action applyWeight −2.5', () => {
    const result = generateSuggestions([
      completed(1, 60, 8, 10, 0, 1),
      completed(1, 60, 8, 10, 0, 2),
    ])
    const s = result.find((x) => x.id === 'decrease-1')
    expect(s?.type).toBe('decrease')
    expect(s?.action).toEqual({ kind: 'applyWeight', amountKg: -2.5 })
  })
})

describe('generateSuggestions — calentamiento por peso alto', () => {
  it('dispara warmup si el primer set de trabajo ≥ 70% del e1RM y no hay warmup', () => {
    const result = generateSuggestions(
      [completed(5, 80, 8, 7, 2, 1)],
      {
        knownE1RM: { 5: 100 },
        activeSets: [active(5, 80, 1)],
      }
    )
    const s = result.find((x) => x.id === 'warmup-5')
    expect(s?.type).toBe('warmup')
    expect(s?.exerciseId).toBe(5)
    expect(s?.messageKey).toBe('suggestions.warmupHighWeight')
    const warmupKg = Math.round(80 * WARMUP_WEIGHT_RATIO * 2) / 2
    expect(s?.action).toEqual({ kind: 'addWarmupSet', warmupWeightKg: warmupKg })
    // El umbral es el 70% del e1RM conocido.
    expect(80 >= Math.round(100 * WARMUP_E1RM_THRESHOLD)).toBe(true)
  })

  it('no dispara si el peso de trabajo es < 70% del e1RM', () => {
    const result = generateSuggestions(
      [completed(5, 60, 8, 7, 2, 1)],
      {
        knownE1RM: { 5: 100 },
        activeSets: [active(5, 60, 1)],
      }
    )
    expect(result.some((x) => x.type === 'warmup')).toBe(false)
  })

  it('no dispara si el ejercicio ya tiene una serie de calentamiento', () => {
    const result = generateSuggestions(
      [completed(5, 80, 8, 7, 2, 2)],
      {
        knownE1RM: { 5: 100 },
        activeSets: [active(5, 40, 1, true, false), active(5, 80, 2)],
      }
    )
    expect(result.some((x) => x.type === 'warmup')).toBe(false)
  })

  it('no dispara sin e1RM conocido para el ejercicio', () => {
    const result = generateSuggestions(
      [completed(5, 80, 8, 7, 2, 1)],
      {
        knownE1RM: {},
        activeSets: [active(5, 80, 1)],
      }
    )
    expect(result.some((x) => x.type === 'warmup')).toBe(false)
  })

  it('no dispara sin series de trabajo con peso (solo warmups o cero)', () => {
    const result = generateSuggestions(
      [completed(5, 80, 8, 7, 2, 1)],
      {
        knownE1RM: { 5: 100 },
        activeSets: [active(5, 0, 1)],
      }
    )
    expect(result.some((x) => x.type === 'warmup')).toBe(false)
  })

  it('solo hay UNA sugerencia de warmup por ejercicio aunque repita en completadas', () => {
    const result = generateSuggestions(
      [completed(5, 80, 8, 7, 2, 1), completed(5, 80, 8, 7, 2, 2)],
      {
        knownE1RM: { 5: 100 },
        activeSets: [active(5, 80, 1), active(5, 80, 2)],
      }
    )
    expect(result.filter((x) => x.type === 'warmup')).toHaveLength(1)
  })

  it('el peso del warmup se redondea a 0.5 kg', () => {
    const result = generateSuggestions(
      [completed(5, 57.5, 8, 7, 2, 1)],
      {
        knownE1RM: { 5: 80 },
        activeSets: [active(5, 57.5, 1)],
      }
    )
    const s = result.find((x) => x.id === 'warmup-5')
    expect(s?.action && 'warmupWeightKg' in s.action ? s.action.warmupWeightKg : null).toBe(
      Math.round(57.5 * WARMUP_WEIGHT_RATIO * 2) / 2
    )
  })
})

describe('generateSuggestions — regresión sin opciones', () => {
  it('conserva rest y performanceDrop sin action y sin warmup', () => {
    const result = generateSuggestions([
      completed(1, 60, 12, 8, 1, 1),
      completed(1, 60, 10, 8, 1, 2),
      completed(1, 60, 4, 8, 1, 3),
    ])
    expect(result.some((x) => x.id === 'rest-1')).toBe(true)
    expect(result.some((x) => x.id === 'warning-1')).toBe(true)
    expect(result.some((x) => x.type === 'warmup')).toBe(false)
    // Las sugerencias de descanso/rendimiento no llevan acción.
    for (const s of result) {
      if (s.type !== 'increase' && s.type !== 'decrease') {
        expect(s.action).toBeUndefined()
      }
    }
  })
})