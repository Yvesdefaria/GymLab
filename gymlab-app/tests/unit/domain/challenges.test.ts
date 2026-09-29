// Tests del reto diario de pasos (F84e): progreso contra la meta del día.
import { describe, expect, it } from 'vitest'
import {
  CHALLENGES,
  calculateProgress,
  computeChallengeStats,
  currentForChallenge,
  defaultChallengeTab,
  deriveLevel,
  getAvailableChallenges,
  getDailyStepChallenge,
  STEP_CHALLENGE_ID,
  countEverCompletedChallenges,
  type Challenge,
  type ChallengeDuration,
} from '@/domain/challenges'
import { addLocalDays, toLocalDateStr, weekStartKey } from '@/domain/dates'
import type {
  DailyStepsEntry,
  ExerciseCategory,
  Level,
  MuscleGroup,
  Workout,
  WorkoutSet,
} from '@/domain/types'

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

// --- F68: retos dinámicos adaptativos (nivel, disponibilidad, progreso y series) ---
const LEVEL_ORDER: Record<Level, number> = {
  principiante: 0,
  intermedio: 1,
  avanzado: 2,
}

// Fixtures tipadas y completas: nada de `any` ni campos opcionales inventados.
const makeWorkout = (id: number, localDate: string, totalVolume = 0): Workout => ({
  id,
  startedAt: `${localDate}T10:00:00`,
  finishedAt: `${localDate}T11:00:00`,
  routineId: null,
  routineDayId: null,
  localDate,
  notes: '',
  totalVolume,
})

const makeSet = (
  id: number,
  workoutId: number,
  completed: boolean,
  weightKg = 10,
  reps = 10,
  isWarmup = false,
  overrides: Partial<WorkoutSet> = {},
): WorkoutSet => ({
  id,
  workoutId,
  exerciseId: 1,
  setNumber: 1,
  weightKg,
  reps,
  completed,
  isWarmup,
  createdAt: `${toLocalDateStr()}T10:00:00`,
  ...overrides,
})

const makeWorkouts = (count: number): Workout[] =>
  Array.from({ length: count }, (_, i) => makeWorkout(i + 1, toLocalDateStr()))

const challengeById = (id: string): Challenge => {
  const found = CHALLENGES.find((c) => c.id === id)
  if (!found) throw new Error(`Reto no encontrado: ${id}`)
  return found
}

describe('Retos dinámicos adaptativos (F68)', () => {
  describe('deriveLevel', () => {
    it('con menos de 40 entrenos es principiante (borde 39)', () => {
      expect(deriveLevel(makeWorkouts(39))).toBe('principiante')
    })

    it('con 40 entrenos pasa a intermedio (borde 40)', () => {
      expect(deriveLevel(makeWorkouts(40))).toBe('intermedio')
    })

    it('con 149 entrenos sigue siendo intermedio (borde 149)', () => {
      expect(deriveLevel(makeWorkouts(149))).toBe('intermedio')
    })

    it('con 150 entrenos pasa a avanzado (borde 150)', () => {
      expect(deriveLevel(makeWorkouts(150))).toBe('avanzado')
    })
  })

  describe('getAvailableChallenges', () => {
    // Datos reales: 5 retos principiante + 6 intermedio + 3 avanzado = 14;
    // intermedio ve 11 (los 5 de principiante más los 6 suyos) y avanzado 14.
    it('principiante ve 5 retos, intermedio 11 y avanzado 14', () => {
      expect(getAvailableChallenges('principiante')).toHaveLength(5)
      expect(getAvailableChallenges('intermedio')).toHaveLength(11)
      expect(getAvailableChallenges('avanzado')).toHaveLength(14)
    })

    it('todos los devueltos tienen minLevel <= nivel del usuario', () => {
      const levels: Level[] = ['principiante', 'intermedio', 'avanzado']
      for (const level of levels) {
        for (const c of getAvailableChallenges(level)) {
          expect(LEVEL_ORDER[c.minLevel]).toBeLessThanOrEqual(LEVEL_ORDER[level])
        }
      }
    })
  })

  describe('defaultChallengeTab', () => {
    it('sin retos activos pero con disponibles abre en «Disponibles» (0, 4)', () => {
      expect(defaultChallengeTab(0, 4)).toBe('available')
    })

    it('con retos activos mantiene «Activos» (3, 1)', () => {
      expect(defaultChallengeTab(3, 1)).toBe('active')
    })

    it('sin ningún reto abre en «Activos» (0, 0)', () => {
      expect(defaultChallengeTab(0, 0)).toBe('active')
    })

    it('con un solo activo y ningún disponible mantiene «Activos» (1, 0)', () => {
      expect(defaultChallengeTab(1, 0)).toBe('active')
    })
  })

  describe('calculateProgress', () => {
    it('por debajo del target muestra el progreso real sin completar', () => {
      const p = calculateProgress(challengeById('vol-20'), 15)
      expect(p.current).toBe(15)
      expect(p.completed).toBe(false)
    })

    it('exactamente en el target marca completed', () => {
      const p = calculateProgress(challengeById('vol-20'), 20)
      expect(p.current).toBe(20)
      expect(p.completed).toBe(true)
    })

    it('en exceso completa y clampa el current al target', () => {
      const p = calculateProgress(challengeById('vol-20'), 35)
      expect(p.current).toBe(20)
      expect(p.target).toBe(20)
      expect(p.completed).toBe(true)
    })
  })

  describe('semántica de series en los retos de volumen', () => {
    it('vol-20 usa la unidad de series con target 20', () => {
      const c = challengeById('vol-20')
      expect(c.unitKey).toBe('challenge.unit.sets')
      expect(c.target).toBe(20)
    })

    it('vol-40 usa la unidad de series con target 40', () => {
      const c = challengeById('vol-40')
      expect(c.unitKey).toBe('challenge.unit.sets')
      expect(c.target).toBe(40)
    })

    it('vol-80 usa la unidad de series con target 80', () => {
      const c = challengeById('vol-80')
      expect(c.unitKey).toBe('challenge.unit.sets')
      expect(c.target).toBe(80)
    })
  })

  describe('computeChallengeStats — conteo de series', () => {
    const today = toLocalDateStr()
    // ~400 días atrás queda fuera de las 4 duraciones (2 meses es la más larga).
    const oldDate = addLocalDays(today, -400)

    it('cuenta solo las series con completed === true', () => {
      const workouts = [makeWorkout(1, today)]
      const sets = [
        makeSet(1, 1, true),
        makeSet(2, 1, true),
        makeSet(3, 1, true),
        makeSet(4, 1, false),
      ]
      expect(computeChallengeStats(workouts, [], sets)['1semana'].setsCount).toBe(3)
    })

    it('un workout de hoy suma en 1semana y uno de hace ~400 días no suma en ninguna duración', () => {
      const workouts = [makeWorkout(1, today), makeWorkout(2, oldDate)]
      const sets = [makeSet(1, 1, true), makeSet(2, 2, true)]
      const stats = computeChallengeStats(workouts, [], sets)
      const durations: ChallengeDuration[] = ['1semana', '2semanas', '1mes', '2meses']
      for (const duration of durations) {
        expect(stats[duration].setsCount).toBe(1)
      }
    })

    it('no depende del peso: 20 series de 10 kg dan setsCount 20', () => {
      // 20 series × 10 kg = 200 kg de volumen, muy por debajo del viejo target de 5000.
      const workouts = [makeWorkout(1, today, 200)]
      const sets = Array.from({ length: 20 }, (_, i) => makeSet(i + 1, 1, true, 10, 1))
      expect(computeChallengeStats(workouts, [], sets)['1semana'].setsCount).toBe(20)
    })

    it('ignora una serie cuyo workoutId no corresponde a ningún workout de la lista', () => {
      const workouts = [makeWorkout(1, today)]
      const sets = [makeSet(1, 1, true), makeSet(2, 999, true)]
      expect(computeChallengeStats(workouts, [], sets)['1semana'].setsCount).toBe(1)
    })
  })

  describe('computeChallengeStats — conteo de PRs', () => {
    const today = toLocalDateStr()
    const oldDate = addLocalDays(today, -400)

    it('un PR de hoy cuenta en 1semana', () => {
      expect(computeChallengeStats([], [today], [])['1semana'].prsCount).toBe(1)
    })

    it('un PR de hace ~400 días no cuenta en ninguna duración', () => {
      const stats = computeChallengeStats([], [oldDate], [])
      const durations: ChallengeDuration[] = ['1semana', '2semanas', '1mes', '2meses']
      for (const duration of durations) {
        expect(stats[duration].prsCount).toBe(0)
      }
    })
  })

  describe('computeChallengeStats — semanas consecutivas', () => {
    const today = toLocalDateStr()
    // Los offsets -7, -14, -21 y -28 son múltiplos de 7 desde hoy: caen en semanas
    // anteriores distintas (nunca en fechas hardcodeadas). La semana en curso
    // (offset 0) se deja vacía a propósito para probar que no rompe la racha.
    const workoutsAt = (offsets: number[]): Workout[] =>
      offsets.map((d, i) => makeWorkout(i + 1, addLocalDays(today, d)))

    it('4 semanas previas y nada en la semana en curso dan racha 4 (no la corta)', () => {
      const workouts = workoutsAt([-7, -14, -21, -28])
      expect(computeChallengeStats(workouts, [], [])['1mes'].consecutiveWeeks).toBe(4)
    })

    it('semana en curso con sesión más las 2 anteriores dan racha 3', () => {
      const workouts = workoutsAt([0, -7, -14])
      expect(computeChallengeStats(workouts, [], [])['1mes'].consecutiveWeeks).toBe(3)
    })

    it('un hueco real (semana -14 vacía) corta la racha en 1', () => {
      const workouts = workoutsAt([-7, -21])
      expect(computeChallengeStats(workouts, [], [])['1mes'].consecutiveWeeks).toBe(1)
    })

    it('sin entrenamientos la racha es 0', () => {
      expect(computeChallengeStats([], [], [])['1mes'].consecutiveWeeks).toBe(0)
    })

    it('solo con la semana en curso la racha es 1', () => {
      const workouts = workoutsAt([0])
      expect(computeChallengeStats(workouts, [], [])['1mes'].consecutiveWeeks).toBe(1)
    })
  })

  describe('computeChallengeStats — calentamientos', () => {
    const today = toLocalDateStr()

    it('una serie de calentamiento completada NO suma al reto', () => {
      const workouts = [makeWorkout(1, today)]
      const sets = [makeSet(1, 1, true, 10, 10, true)]
      expect(computeChallengeStats(workouts, [], sets)['1semana'].setsCount).toBe(0)
    })

    it('1 serie de trabajo + 1 de calentamiento completas cuentan solo 1', () => {
      const workouts = [makeWorkout(1, today)]
      const sets = [makeSet(1, 1, true), makeSet(2, 1, true, 10, 10, true)]
      expect(computeChallengeStats(workouts, [], sets)['1semana'].setsCount).toBe(1)
    })

    it('2 de trabajo + 1 de calentamiento incompleta cuentan 2', () => {
      const workouts = [makeWorkout(1, today)]
      const sets = [
        makeSet(1, 1, true),
        makeSet(2, 1, true),
        makeSet(3, 1, false, 10, 10, true),
      ]
      expect(computeChallengeStats(workouts, [], sets)['1semana'].setsCount).toBe(2)
    })

    it('sin calentamientos el conteo no cambia (20 series de trabajo dan 20)', () => {
      const workouts = [makeWorkout(1, today, 200)]
      const sets = Array.from({ length: 20 }, (_, i) => makeSet(i + 1, 1, true, 10, 1))
      expect(computeChallengeStats(workouts, [], sets)['1semana'].setsCount).toBe(20)
    })
  })

  describe('countEverCompletedChallenges', () => {
    it('sin datos no cuenta ningún reto completado', () => {
      expect(countEverCompletedChallenges([], [], [])).toBe(0)
    })

    it('tres sesiones de una semana pasada cuentan freq-3 aunque esta semana esté vacía', () => {
      const pastWeek = weekStartKey(addLocalDays(toLocalDateStr(), -21))
      const workouts = [
        makeWorkout(1, pastWeek),
        makeWorkout(2, addLocalDays(pastWeek, 1)),
        makeWorkout(3, addLocalDays(pastWeek, 2)),
      ]
      expect(countEverCompletedChallenges(workouts, [], [])).toBeGreaterThanOrEqual(1)
      expect(computeChallengeStats(workouts, [], [])['1semana'].sessionsCount).toBe(0)
    })
  })
})

// --- F109.2: retos de pasos, cardio, volumen por grupo muscular y días seguidos ---
describe('Retos nuevos de pasos, cardio, pierna y días seguidos (F109.2)', () => {
  const today = toLocalDateStr()
  // Ancla a la semana actual: el test no depende del día de la semana en que corra.
  const weekStart = weekStartKey(today)

  const makeStepDay = (localDate: string, steps: number): DailyStepsEntry => ({
    id: 0,
    localDate,
    steps,
    distanceKm: 0,
    calories: 0,
    source: 'manual',
    syncedAt: `${localDate}T20:00:00`,
  })

  it('sin señales nuevas las stats de F109.2 quedan en 0/{}', () => {
    const stats = computeChallengeStats([], [], [])['1semana']
    expect(stats.stepsTotal).toBe(0)
    expect(stats.cardioSeconds).toBe(0)
    expect(stats.muscleVolume).toEqual({})
    expect(stats.longestDailyRun).toBe(0)
  })

  describe('pasos-100k', () => {
    it('completa con 110.000 pasos en la semana', () => {
      const workouts = [makeWorkout(1, today)]
      const stepDays = [
        makeStepDay(weekStart, 60_000),
        makeStepDay(addLocalDays(weekStart, 1), 50_000),
      ]
      const stats = computeChallengeStats(workouts, [], [], undefined, { stepDays })['1semana']
      const c = challengeById('pasos-100k')
      expect(stats.stepsTotal).toBe(110_000)
      expect(calculateProgress(c, currentForChallenge(c, stats)).completed).toBe(true)
    })

    it('con 90.000 pasos queda en progreso 0.9 sin completar', () => {
      const stepDays = [makeStepDay(weekStart, 90_000)]
      const stats = computeChallengeStats([], [], [], undefined, { stepDays })['1semana']
      const c = challengeById('pasos-100k')
      const p = calculateProgress(c, currentForChallenge(c, stats))
      expect(p.completed).toBe(false)
      expect(p.current / p.target).toBeCloseTo(0.9)
    })

    it('los pasos de una semana anterior no cuentan', () => {
      const stepDays = [makeStepDay(addLocalDays(weekStart, -7), 200_000)]
      const stats = computeChallengeStats([], [], [], undefined, { stepDays })['1semana']
      expect(stats.stepsTotal).toBe(0)
    })
  })

  describe('cardio-45', () => {
    it('completa con 900 s + 1800 s de cardio (45 min)', () => {
      const workouts = [makeWorkout(1, today)]
      const sets = [
        makeSet(1, 1, true, 0, 0, false, { exerciseId: 7, durationSeconds: 900 }),
        makeSet(2, 1, true, 0, 0, false, { exerciseId: 7, durationSeconds: 1800 }),
      ]
      const stats = computeChallengeStats(workouts, [], sets)['2semanas']
      const c = challengeById('cardio-45')
      expect(stats.cardioSeconds).toBe(2700)
      expect(calculateProgress(c, currentForChallenge(c, stats)).completed).toBe(true)
    })

    it('ignora series incompletas y suma el calentamiento de cardio (mismo filtro que los logros)', () => {
      const workouts = [makeWorkout(1, today)]
      const sets = [
        makeSet(1, 1, false, 0, 0, false, { durationSeconds: 600 }),
        makeSet(2, 1, true, 0, 0, true, { durationSeconds: 600 }),
      ]
      expect(computeChallengeStats(workouts, [], sets)['2semanas'].cardioSeconds).toBe(600)
    })

    it('una serie con duración de un ejercicio no cardio (categoría conocida) no cuenta', () => {
      const workouts = [makeWorkout(1, today)]
      const sets = [makeSet(1, 1, true, 0, 0, false, { exerciseId: 5, durationSeconds: 600 })]
      const exerciseCategories = new Map<number, ExerciseCategory>([[5, 'stretch']])
      const stats = computeChallengeStats(workouts, [], sets, undefined, { exerciseCategories })['2semanas']
      expect(stats.cardioSeconds).toBe(0)
    })

    it('sin categoría conocida, una serie con duración cuenta como cardio', () => {
      const workouts = [makeWorkout(1, today)]
      const sets = [makeSet(1, 1, true, 0, 0, false, { exerciseId: 8, durationSeconds: 300 })]
      expect(computeChallengeStats(workouts, [], sets)['2semanas'].cardioSeconds).toBe(300)
    })
  })

  describe('vol-pierna-5000', () => {
    it('completa con 5.000 kg de volumen de pierna en dos semanas', () => {
      const workouts = [makeWorkout(1, today)]
      // 5 series × 100 kg × 10 reps = 5.000 kg de volumen.
      const sets = Array.from({ length: 5 }, (_, i) =>
        makeSet(i + 1, 1, true, 100, 10, false, { exerciseId: 1 }),
      )
      const exerciseMuscles = new Map<number, MuscleGroup>([[1, 'pierna']])
      const stats = computeChallengeStats(workouts, [], sets, undefined, { exerciseMuscles })['2semanas']
      const c = challengeById('vol-pierna-5000')
      expect(c.muscleGroup).toBe('pierna')
      expect(stats.muscleVolume.pierna).toBe(5_000)
      expect(calculateProgress(c, currentForChallenge(c, stats)).completed).toBe(true)
    })

    it('el mismo volumen en pecho no completa el reto', () => {
      const workouts = [makeWorkout(1, today)]
      const sets = Array.from({ length: 5 }, (_, i) =>
        makeSet(i + 1, 1, true, 100, 10, false, { exerciseId: 2 }),
      )
      const exerciseMuscles = new Map<number, MuscleGroup>([[2, 'pecho']])
      const stats = computeChallengeStats(workouts, [], sets, undefined, { exerciseMuscles })['2semanas']
      const c = challengeById('vol-pierna-5000')
      expect(stats.muscleVolume.pierna).toBeUndefined()
      expect(calculateProgress(c, currentForChallenge(c, stats)).completed).toBe(false)
    })

    it('sin mapa de músculos el volumen queda vacío', () => {
      const workouts = [makeWorkout(1, today)]
      const sets = [makeSet(1, 1, true, 100, 10)]
      expect(computeChallengeStats(workouts, [], sets)['2semanas'].muscleVolume).toEqual({})
    })
  })

  describe('dias-4', () => {
    it('completa con 4 días consecutivos con sesión en la semana', () => {
      const workouts = [0, 1, 2, 3].map((d) => makeWorkout(d + 1, addLocalDays(weekStart, d)))
      const stats = computeChallengeStats(workouts, [], [])['1semana']
      const c = challengeById('dias-4')
      expect(stats.longestDailyRun).toBe(4)
      expect(calculateProgress(c, currentForChallenge(c, stats)).completed).toBe(true)
    })

    it('un hueco corta la racha: 4 días con un salto no completan', () => {
      const workouts = [0, 1, 3, 4].map((d) => makeWorkout(d + 1, addLocalDays(weekStart, d)))
      const stats = computeChallengeStats(workouts, [], [])['1semana']
      const c = challengeById('dias-4')
      expect(stats.longestDailyRun).toBe(2)
      expect(calculateProgress(c, currentForChallenge(c, stats)).completed).toBe(false)
    })

    it('las sesiones fuera de la semana no suman a la racha', () => {
      const workouts = [0, 1, 2].map((d) => makeWorkout(d + 1, addLocalDays(weekStart, d - 7)))
      expect(computeChallengeStats(workouts, [], [])['1semana'].longestDailyRun).toBe(0)
    })
  })

  describe('getAvailableChallenges — minLevel de los nuevos', () => {
    it('los nuevos respetan su minLevel', () => {
      const idsFor = (level: Level) => getAvailableChallenges(level).map((c) => c.id)
      expect(idsFor('principiante')).toContain('pasos-100k')
      expect(idsFor('principiante')).not.toContain('cardio-45')
      expect(idsFor('intermedio')).toContain('cardio-45')
      expect(idsFor('intermedio')).toContain('dias-4')
      expect(idsFor('intermedio')).not.toContain('vol-pierna-5000')
      expect(idsFor('avanzado')).toContain('vol-pierna-5000')
    })

    it('cada reto nuevo declara su tipo y su unidad', () => {
      expect(challengeById('pasos-100k').type).toBe('pasos')
      expect(challengeById('cardio-45').type).toBe('cardio')
      expect(challengeById('cardio-45').target).toBe(45)
      expect(challengeById('dias-4').type).toBe('consistencia')
    })
  })

  describe('countEverCompletedChallenges con señales nuevas', () => {
    it('cuenta pasos-100k al pasar stepDays y no lo cuenta sin ellas', () => {
      const workouts = [makeWorkout(1, today)]
      const stepDays = [makeStepDay(weekStart, 110_000)]
      expect(countEverCompletedChallenges(workouts, [], [], { stepDays })).toBe(1)
      expect(countEverCompletedChallenges(workouts, [], [])).toBe(0)
    })
  })
})