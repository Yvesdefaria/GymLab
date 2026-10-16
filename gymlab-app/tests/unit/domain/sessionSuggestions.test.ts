// Tests del motor de sugerencias de sesión (F63/F97/F98.2/F118): acciones aplicables con
// objetivo absoluto, señal por el motor sin RPE/RIR, esfuerzo evaluado solo con datos
// reales y calentamientos excluidos de la entrada del motor.
import { describe, expect, it } from 'vitest'
import {
  completedSetsForSuggestions,
  generateSuggestions,
  WARMUP_E1RM_THRESHOLD,
  WARMUP_WEIGHT_RATIO,
  type ActiveSetInput,
  type CompletedSet,
} from '@/domain/sessionSuggestions'

// Serie completada de trabajo. `rpe`/`rir` quedan undefined por defecto: sin datos de esfuerzo.
const completed = (
  exerciseId: number,
  weightKg: number,
  reps: number,
  rpe?: number,
  rir?: number,
  setNumber = 1
): CompletedSet => ({ exerciseId, weightKg, reps, rpe, rir, setNumber })

// Serie de la sesión activa (completada o pendiente) para el trigger de calentamiento
// y para el tope de las pendientes.
const active = (
  exerciseId: number,
  weightKg: number,
  setNumber: number,
  isWarmup = false,
  completedFlag = false
): ActiveSetInput => ({ exerciseId, weightKg, isWarmup, completed: completedFlag, setNumber })

describe('generateSuggestions — increase por motor (F118)', () => {
  it('objetivo > top: acción absoluta y data con target/withMargin/capped', () => {
    const result = generateSuggestions([completed(1, 60, 8, 5, 3, 1)], {
      loadTargetByExercise: { 1: { weightKg: 62.5, capped: false } },
    })
    const s = result.find((x) => x.id === 'increase-1')
    expect(s?.type).toBe('increase')
    expect(s?.messageKey).toBe('suggestions.increaseWeight')
    expect(s?.action).toEqual({ kind: 'applyWeight', targetKg: 62.5 })
    expect(s?.data).toEqual({ amount: 2.5, target: 62.5 })
    expect(s?.capped).toBe(false)
  })

  it('sin datos de esfuerzo el mensaje es neutro (sin afirmar margen)', () => {
    const result = generateSuggestions([completed(1, 60, 8)], {
      loadTargetByExercise: { 1: { weightKg: 62.5, capped: false } },
    })
    const s = result.find((x) => x.id === 'increase-1')
    expect(s?.messageKey).toBe('suggestions.increaseWeightNeutral')
  })

  it('con RPE real alto (≥8) el increase se suprime', () => {
    const result = generateSuggestions([completed(1, 65, 8, 9, 1, 1)], {
      loadTargetByExercise: { 1: { weightKg: 70, capped: false } },
    })
    expect(result.some((x) => x.type === 'increase')).toBe(false)
  })

  it('con RIR real ≤1 el increase se suprime', () => {
    const result = generateSuggestions([completed(1, 65, 8, undefined, 1, 1)], {
      loadTargetByExercise: { 1: { weightKg: 70, capped: false } },
    })
    expect(result.some((x) => x.type === 'increase')).toBe(false)
  })

  it('el top de la sesión manda (no la última serie)', () => {
    const result = generateSuggestions(
      [completed(1, 90, 8, 7, 2, 1), completed(1, 80, 8, 7, 2, 2)],
      { loadTargetByExercise: { 1: { weightKg: 92.5, capped: false } } }
    )
    expect(result.find((x) => x.id === 'increase-1')?.data).toMatchObject({ amount: 2.5 })
  })

  it('no emite increase sin objetivo del motor (sin historial no hay entrada)', () => {
    const result = generateSuggestions([completed(1, 60, 8, 5, 3, 1)])
    expect(result.some((x) => x.type === 'increase')).toBe(false)
  })

  it('no emite increase si el objetivo no supera el top', () => {
    const result = generateSuggestions([completed(1, 60, 8, 5, 3, 1)], {
      loadTargetByExercise: { 1: { weightKg: 60, capped: false } },
    })
    expect(result.some((x) => x.type === 'increase')).toBe(false)
  })

  it('no emite increase si las pendientes ya están en el objetivo o por encima', () => {
    const result = generateSuggestions([completed(1, 60, 8, 5, 3, 1)], {
      loadTargetByExercise: { 1: { weightKg: 62.5, capped: false } },
      activeSets: [active(1, 62.5, 2)],
    })
    expect(result.some((x) => x.type === 'increase')).toBe(false)
  })

  it('propaga capped del techo PR a la sugerencia', () => {
    const result = generateSuggestions([completed(1, 55, 8, 5, 3, 1)], {
      loadTargetByExercise: { 1: { weightKg: 60, capped: true } },
    })
    const s = result.find((x) => x.id === 'increase-1')
    expect(s?.data).toMatchObject({ target: 60 })
    expect(s?.capped).toBe(true)
  })
})

describe('generateSuggestions — decrease y rest solo con esfuerzo real (F118)', () => {
  it('decrease: objetivo absoluto (top − 2.5)', () => {
    const result = generateSuggestions([completed(1, 60, 8, 10, 0, 1)])
    const s = result.find((x) => x.id === 'decrease-1')
    expect(s?.type).toBe('decrease')
    expect(s?.messageKey).toBe('suggestions.decreaseWeight')
    expect(s?.action).toEqual({ kind: 'applyWeight', targetKg: 57.5 })
    expect(s?.data).toEqual({ amount: 2.5, target: 57.5 })
  })

  it('con RIR real ≤0.5 (sin RPE) también baja', () => {
    const result = generateSuggestions([completed(1, 60, 8, undefined, 0, 1)])
    expect(result.some((x) => x.id === 'decrease-1')).toBe(true)
  })

  it('sin ningún dato de esfuerzo no hay decrease ni rest (no se inventa fatiga)', () => {
    const sets = [
      completed(1, 60, 12, undefined, undefined, 1),
      completed(1, 60, 12, undefined, undefined, 2),
      completed(1, 60, 12, undefined, undefined, 3),
    ]
    const result = generateSuggestions(sets, { restMinutesByExercise: { 1: 4 } })
    expect(result.some((x) => x.type === 'decrease' || x.type === 'rest')).toBe(false)
  })

  it('usa los minutos recomendados por ejercicio (RPE real ≥8 y ≥3 series)', () => {
    const sets = [
      completed(1, 60, 12, 8, 1, 1),
      completed(1, 60, 10, 8, 1, 2),
      completed(1, 60, 8, 8, 1, 3),
    ]
    const result = generateSuggestions(sets, { restMinutesByExercise: { 1: 4 } })
    expect(result.find((x) => x.id === 'rest-1')?.data).toEqual({ minutes: 4 })
  })

  it('no emite descanso sin recomendación (no hay minutos hardcodeados)', () => {
    const sets = [
      completed(1, 60, 12, 8, 1, 1),
      completed(1, 60, 10, 8, 1, 2),
      completed(1, 60, 8, 8, 1, 3),
    ]
    const result = generateSuggestions(sets)
    expect(result.some((x) => x.type === 'rest')).toBe(false)
  })

  it('respeta los minutos recomendados de cada ejercicio', () => {
    const sets = [
      completed(1, 60, 12, 8, 1, 1),
      completed(1, 60, 10, 8, 1, 2),
      completed(1, 60, 8, 8, 1, 3),
      completed(2, 40, 12, 8, 1, 1),
      completed(2, 40, 10, 8, 1, 2),
      completed(2, 40, 8, 8, 1, 3),
    ]
    const result = generateSuggestions(sets, { restMinutesByExercise: { 1: 3, 2: 1 } })
    expect(result.find((x) => x.id === 'rest-1')?.data).toEqual({ minutes: 3 })
    expect(result.find((x) => x.id === 'rest-2')?.data).toEqual({ minutes: 1 })
  })
})

describe('completedSetsForSuggestions — calentamientos fuera de la entrada (G4)', () => {
  it('excluye calentamientos completados y el pipeline no dispara el rest de ≥3', () => {
    const exercises = [
      {
        exerciseId: 1,
        sets: [
          { weightKg: 45, reps: 8, rpe: 8, rir: 1, setNumber: 1, completed: true, isWarmup: true },
          { weightKg: 45, reps: 8, rpe: 8, rir: 1, setNumber: 2, completed: true, isWarmup: true },
          { weightKg: 45, reps: 8, rpe: 8, rir: 1, setNumber: 3, completed: true, isWarmup: true },
          { weightKg: 60, reps: 8, rpe: 8, rir: 1, setNumber: 4, completed: true },
          { weightKg: 60, reps: 8, rpe: 8, rir: 1, setNumber: 5, completed: true },
        ],
      },
    ]
    const sets = completedSetsForSuggestions(exercises)
    expect(sets).toHaveLength(2)
    const result = generateSuggestions(sets, { restMinutesByExercise: { 1: 4 } })
    expect(result.some((x) => x.type === 'rest')).toBe(false)
  })

  it('el top ignora el calentamiento más pesado', () => {
    const exercises = [
      {
        exerciseId: 1,
        sets: [
          { weightKg: 120, reps: 8, setNumber: 1, completed: true, isWarmup: true },
          { weightKg: 100, reps: 8, setNumber: 2, completed: true },
        ],
      },
    ]
    const sets = completedSetsForSuggestions(exercises)
    const result = generateSuggestions(sets, {
      loadTargetByExercise: { 1: { weightKg: 102.5, capped: false } },
    })
    expect(result.find((x) => x.id === 'increase-1')?.data).toMatchObject({ amount: 2.5 })
  })

  it('sin puerta de ≥2 series: una sola serie de trabajo ya puede disparar (F98.2)', () => {
    const result = generateSuggestions([completed(1, 60, 8, 5, 3, 1)], {
      loadTargetByExercise: { 1: { weightKg: 62.5, capped: false } },
    })
    expect(result.find((x) => x.id === 'increase-1')).toBeDefined()
  })
})

describe('generateSuggestions — calentamiento por peso alto', () => {
  it('dispara warmup si el primer set de trabajo ≥ 70% del e1RM y no hay warmup', () => {
    const result = generateSuggestions(
      [completed(5, 80, 8)],
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
      [completed(5, 60, 8)],
      {
        knownE1RM: { 5: 100 },
        activeSets: [active(5, 60, 1)],
      }
    )
    expect(result.some((x) => x.type === 'warmup')).toBe(false)
  })

  it('no dispara si el ejercicio ya tiene una serie de calentamiento', () => {
    const result = generateSuggestions(
      [completed(5, 80, 8)],
      {
        knownE1RM: { 5: 100 },
        activeSets: [active(5, 40, 1, true, false), active(5, 80, 2)],
      }
    )
    expect(result.some((x) => x.type === 'warmup')).toBe(false)
  })

  it('no dispara sin e1RM conocido para el ejercicio', () => {
    const result = generateSuggestions(
      [completed(5, 80, 8)],
      {
        knownE1RM: {},
        activeSets: [active(5, 80, 1)],
      }
    )
    expect(result.some((x) => x.type === 'warmup')).toBe(false)
  })

  it('no dispara sin series de trabajo con peso (solo warmups o cero)', () => {
    const result = generateSuggestions(
      [completed(5, 80, 8)],
      {
        knownE1RM: { 5: 100 },
        activeSets: [active(5, 0, 1)],
      }
    )
    expect(result.some((x) => x.type === 'warmup')).toBe(false)
  })

  it('solo hay UNA sugerencia de warmup por ejercicio aunque repita en completadas', () => {
    const result = generateSuggestions(
      [completed(5, 80, 8, undefined, undefined, 1), completed(5, 80, 8, undefined, undefined, 2)],
      {
        knownE1RM: { 5: 100 },
        activeSets: [active(5, 80, 1), active(5, 80, 2)],
      }
    )
    expect(result.filter((x) => x.type === 'warmup')).toHaveLength(1)
  })

  it('el peso del warmup se redondea a 0.5 kg', () => {
    const result = generateSuggestions(
      [completed(5, 57.5, 8)],
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

describe('generateSuggestions — regresión', () => {
  it('conserva performanceDrop sin action y sin warmup', () => {
    const result = generateSuggestions([
      completed(1, 60, 12, 8, 1, 1),
      completed(1, 60, 10, 8, 1, 2),
      completed(1, 60, 4, 8, 1, 3),
    ])
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
