// Tests del progreso declarativo de logros (F95.3): el mapa ACHIEVEMENT_PROGRESS
// es la fuente única de current/target/completed para las barras de /logros y
// para la evaluación de checkAchievements. La derivación de stats es pura y
// recibe `now` inyectado para que primer-ano sea determinista.
import { describe, expect, it } from 'vitest'
import {
  ACHIEVEMENT_PROGRESS,
  achievementProgress,
  deriveAchievementStats,
  deriveAchievementStatsCore,
  deriveAchievementStatsSteps,
  progressForAll,
  type AchievementStats,
  type MeasureKey,
} from '@/domain/achievementProgress'
import { ACHIEVEMENTS } from '@/domain/achievements'
import { addLocalDays, toLocalDateStr, weekStartKey } from '@/domain/dates'
import { deriveMealStats } from '@/domain/nutrition'
import type {
  BodyWeightEntry,
  DailyStepsEntry,
  ExerciseCategory,
  MealEntry,
  MuscleGroup,
  PRRecord,
  StreakResult,
  Workout,
  WorkoutSet,
} from '@/domain/types'

// Los ids del catálogo (fuente de verdad del mapa).
const ALL_IDS = [
  'primer-paso',
  'inaugural',
  'racha-4',
  'racha-8',
  'racha-16',
  'primera-marca',
  'volumen-semanal',
  'sesiones-50',
  'consistencia-4s',
  'primera-cardio',
  'ejercicios-100',
  'pr-10kg',
  'guias-completas',
  'sesiones-500',
  'primer-ano',
  'primer-reto',
  // Logros de pasos (F109.1): unificados al catálogo de medallas.
  'primeros-pasos',
  'diez-mil-dia',
  'racha-7-dias',
  'racha-30-dias',
  'cincuenta-mil-semana',
  'doscientos-mil-mes',
  'millon-total',
  'maraton',
  // Medallas de familias nuevas (F109.2): nutrición, cuerpo, entreno, cardio y pasos.
  'nutricion-primera',
  'nutricion-semana',
  'nutricion-proteina',
  'nutricion-30-dias',
  'cuerpo-primer-peso',
  'cuerpo-30-pesos',
  'cuerpo-10-fotos',
  'entreno-5-dias',
  'entreno-90min',
  'entreno-12-semanas',
  'cardio-60min',
  'pasos-50km',
].sort()

const makeWorkout = (overrides: Partial<Workout> = {}): Workout => ({
  id: 1,
  startedAt: '2026-09-13T10:00:00.000Z',
  finishedAt: '2026-09-13T11:00:00.000Z',
  routineId: null,
  routineDayId: null,
  localDate: '2026-09-13',
  notes: '',
  totalVolume: 0,
  ...overrides,
})

const makeSet = (overrides: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: 1,
  workoutId: 1,
  exerciseId: 10,
  setNumber: 1,
  weightKg: 80,
  reps: 8,
  completed: true,
  createdAt: '2026-09-13T10:05:00.000Z',
  ...overrides,
})

const makePR = (overrides: Partial<PRRecord> = {}): PRRecord => ({
  exerciseId: 10,
  weightKg: 100,
  reps: 5,
  date: '2026-01-01T10:00:00.000Z',
  estimated1RM: 112,
  ...overrides,
})

const makeStepDay = (overrides: Partial<DailyStepsEntry> = {}): DailyStepsEntry => ({
  id: 1,
  localDate: '2026-09-01',
  steps: 0,
  distanceKm: 0,
  calories: 0,
  source: 'manual',
  syncedAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
})

// Comida mínima real: la derivación solo lee localDate y los proteinG de items,
// pero el literal completa todos los campos del tipo (sin casts ciegos).
const makeMeal = (overrides: Partial<MealEntry> = {}): MealEntry => ({
  id: 1,
  localDate: '2026-09-01',
  mealType: 'almuerzo',
  items: [
    { foodId: 1, foodKey: 'chickenBreast', grams: 100, kcal: 165, proteinG: 40, carbsG: 0, fatG: 3.6 },
  ],
  createdAt: '2026-09-01T12:00:00.000Z',
  ...overrides,
})

const mealWithProtein = (id: number, localDate: string, proteinG: number): MealEntry =>
  makeMeal({
    id,
    localDate,
    items: [{ foodId: 1, foodKey: 'chickenBreast', grams: 100, kcal: 165, proteinG, carbsG: 0, fatG: 3.6 }],
  })

const makeBodyWeight = (overrides: Partial<BodyWeightEntry> = {}): BodyWeightEntry => ({
  id: 1,
  localDate: '2026-09-01',
  weightKg: 80,
  createdAt: '2026-09-01T08:00:00.000Z',
  ...overrides,
})

const emptyStreak: StreakResult = { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null }

const makeStats = (overrides: Partial<AchievementStats> = {}): AchievementStats => ({
  workoutCount: 0,
  completedSetCount: 0,
  prCount: 0,
  longestStreak: 0,
  maxWeeklyVolume: 0,
  longestConsistentWeekRun: 0,
  cardioSetCount: 0,
  uniqueExerciseCount: 0,
  maxPrDeltaKg: 0,
  daysSinceFirstWorkout: 0,
  guideCount: 0,
  completedGuidesCount: 0,
  completedChallengeCount: 0,
  stepsTotal: 0,
  stepsMaxDay: 0,
  steps10kRun: 0,
  steps7dWindow: 0,
  stepsMonth: 0,
  mealsRegisteredCount: 0,
  consecutiveMealDays: 0,
  maxDailyProteinG: 0,
  mealDaysDistinct: 0,
  bodyWeightCount: 0,
  progressPhotoCount: 0,
  longestDailyWorkoutRun: 0,
  longestSessionMin: 0,
  cardioTotalSeconds: 0,
  stepsDistanceKm: 0,
  ...overrides,
})

// now fijo para que los días transcurridos (primer-ano) no dependan del reloj.
const NOW = new Date('2026-09-13T12:00:00.000Z')

// ─── Mapa declarativo ─────────────────────────────────────────────

describe('ACHIEVEMENT_PROGRESS', () => {
  it('cubre exactamente los 36 ids del catálogo (16 de entreno + 8 de pasos + 12 de familias nuevas)', () => {
    expect(Object.keys(ACHIEVEMENT_PROGRESS).sort()).toEqual(ALL_IDS)
    const catalogIds = ACHIEVEMENTS.map((a) => a.id).sort()
    expect(Object.keys(ACHIEVEMENT_PROGRESS).sort()).toEqual(catalogIds)
  })

  it('declara targets finitos; solo el dinámico (guias-completas) puede ser 0', () => {
    for (const [id, def] of Object.entries(ACHIEVEMENT_PROGRESS)) {
      expect(Number.isFinite(def.target)).toBe(true)
      if (def.targetFrom !== 'guideCount') expect(def.target).toBeGreaterThan(0)
      expect(id).toMatch(/^[a-z0-9-]+$/)
    }
    expect(Object.values(ACHIEVEMENT_PROGRESS).some((d) => d.targetFrom === 'guideCount')).toBe(true)
  })
})

// ─── Progreso por logro (current/target/completed) ─────────────────

describe('achievementProgress', () => {
  it('progreso parcial: racha de 12 semanas en racha-16 → 12/16 sin completar', () => {
    const stats = makeStats({ longestStreak: 12 })
    expect(achievementProgress('racha-16', stats)).toEqual({
      id: 'racha-16', current: 12, target: 16, completed: false,
    })
  })

  it('logro completado: 500 sesiones → 500/500', () => {
    const stats = makeStats({ workoutCount: 500 })
    expect(achievementProgress('sesiones-500', stats)).toEqual({
      id: 'sesiones-500', current: 500, target: 500, completed: true,
    })
  })

  it('sin datos: sesiones-50 → 0/50 (nunca NaN)', () => {
    const stats = makeStats()
    expect(achievementProgress('sesiones-50', stats)).toEqual({
      id: 'sesiones-50', current: 0, target: 50, completed: false,
    })
  })

  it('no-monótono: el mejor histórico llena la barra sin retroceder (racha-8 con best 9)', () => {
    const stats = makeStats({ longestStreak: 9 })
    expect(achievementProgress('racha-8', stats)).toEqual({
      id: 'racha-8', current: 8, target: 8, completed: true,
    })
    expect(achievementProgress('racha-16', stats)).toEqual({
      id: 'racha-16', current: 9, target: 16, completed: false,
    })
  })

  it('primer-ano: días desde la primera sesión capados a 365', () => {
    const stats = makeStats({ daysSinceFirstWorkout: 400 })
    expect(achievementProgress('primer-ano', stats)).toEqual({
      id: 'primer-ano', current: 365, target: 365, completed: true,
    })
  })

  it('guias-completas: current 0 y target dinámico = guías disponibles; sin desbloquear', () => {
    const stats = makeStats({ guideCount: 12 })
    expect(achievementProgress('guias-completas', stats)).toEqual({
      id: 'guias-completas', current: 0, target: 12, completed: false,
    })
  })

  it('guias-completas: con 0 guías tampoco se completa (target 0 no es hito)', () => {
    const stats = makeStats({ guideCount: 0 })
    expect(achievementProgress('guias-completas', stats)).toEqual({
      id: 'guias-completas', current: 0, target: 0, completed: false,
    })
  })

  it('primera-cardio: solo fuerza → 0/1', () => {
    const stats = makeStats({ cardioSetCount: 0 })
    expect(achievementProgress('primera-cardio', stats)).toEqual({
      id: 'primera-cardio', current: 0, target: 1, completed: false,
    })
  })

  it('primera-cardio: una serie cardio → 1/1', () => {
    const stats = makeStats({ cardioSetCount: 1 })
    expect(achievementProgress('primera-cardio', stats)).toEqual({
      id: 'primera-cardio', current: 1, target: 1, completed: true,
    })
  })

  it('id desconocido devuelve un progreso neutro en vez de romper', () => {
    expect(achievementProgress('no-existe', makeStats())).toEqual({
      id: 'no-existe', current: 0, target: 0, completed: false,
    })
  })

  // ─── Logros de pasos (F109.1) ────────────────────────────────────

  it('primeros-pasos: sin pasos no completa; con 1 paso sí', () => {
    expect(achievementProgress('primeros-pasos', makeStats({ stepsTotal: 0 }))).toEqual({
      id: 'primeros-pasos', current: 0, target: 1, completed: false,
    })
    expect(achievementProgress('primeros-pasos', makeStats({ stepsTotal: 1 }))).toEqual({
      id: 'primeros-pasos', current: 1, target: 1, completed: true,
    })
  })

  it('diez-mil-dia: completa con 10.000 exactos y no con 9.999', () => {
    expect(achievementProgress('diez-mil-dia', makeStats({ stepsMaxDay: 10_000 })).completed).toBe(true)
    expect(achievementProgress('diez-mil-dia', makeStats({ stepsMaxDay: 9_999 })).completed).toBe(false)
  })

  it('racha-7-dias: con 12 días de racha clampa current a 7', () => {
    expect(achievementProgress('racha-7-dias', makeStats({ steps10kRun: 12 }))).toEqual({
      id: 'racha-7-dias', current: 7, target: 7, completed: true,
    })
  })

  it('maraton: target 42.000, completa solo al alcanzarlo', () => {
    expect(achievementProgress('maraton', makeStats({ stepsMaxDay: 41_999 }))).toEqual({
      id: 'maraton', current: 41_999, target: 42_000, completed: false,
    })
    expect(achievementProgress('maraton', makeStats({ stepsMaxDay: 42_000 })).completed).toBe(true)
  })
})

// ─── Derivación pura de stats ─────────────────────────────────────

describe('deriveAchievementStats', () => {
  it('entrada vacía → todos los contadores a 0, sin NaN', () => {
    const stats = deriveAchievementStats({
      workouts: [],
      prs: [],
      completedSets: [],
      exerciseCategories: new Map(),
      guideCount: 0,
      streak: emptyStreak,
      now: NOW,
    })
    expect(stats).toEqual(makeStats())
    for (const value of Object.values(stats)) expect(Number.isNaN(value)).toBe(false)
  })

  it('con stepDays deriva las medidas de pasos (total, máximo, racha, ventana y mes)', () => {
    const stats = deriveAchievementStats({
      workouts: [],
      prs: [],
      completedSets: [],
      exerciseCategories: new Map(),
      guideCount: 0,
      streak: emptyStreak,
      now: NOW,
      stepDays: [
        makeStepDay({ localDate: '2026-09-01', steps: 10_200, distanceKm: 7.5 }),
        makeStepDay({ id: 2, localDate: '2026-09-02', steps: 11_000, distanceKm: 8.1 }),
        makeStepDay({ id: 3, localDate: '2026-09-03', steps: 9_400, distanceKm: 6.9 }),
      ],
    })
    expect(stats.stepsTotal).toBe(30_600)
    expect(stats.stepsMaxDay).toBe(11_000)
    expect(stats.steps10kRun).toBe(2)
    expect(stats.steps7dWindow).toBe(30_600)
    expect(stats.stepsMonth).toBe(30_600)
  })

  it('cuenta sesiones, series completadas y PRs', () => {
    const stats = deriveAchievementStats({
      workouts: [makeWorkout(), makeWorkout({ id: 2 })],
      prs: [makePR(), makePR({ exerciseId: 11, weightKg: 60, reps: 8 })],
      completedSets: [makeSet(), makeSet({ id: 2, setNumber: 2 })],
      exerciseCategories: new Map(),
      guideCount: 0,
      streak: emptyStreak,
      now: NOW,
    })
    expect(stats.workoutCount).toBe(2)
    expect(stats.completedSetCount).toBe(2)
    expect(stats.prCount).toBe(2)
  })

  it('volumen semanal: máximo por semana calendario, sumando sesiones de la misma semana', () => {
    const stats = deriveAchievementStats({
      workouts: [
        makeWorkout({ localDate: '2026-09-07', totalVolume: 3000 }),
        makeWorkout({ id: 2, localDate: '2026-09-09', totalVolume: 2500 }),
        makeWorkout({ id: 3, localDate: '2026-09-14', totalVolume: 7000 }),
      ],
      prs: [],
      completedSets: [],
      exerciseCategories: new Map(),
      guideCount: 0,
      streak: emptyStreak,
      now: NOW,
    })
    expect(stats.maxWeeklyVolume).toBe(7000)
  })

  it('cardio: solo series de ejercicios categoría cardio (fallback strength)', () => {
    const categories = new Map<number, ExerciseCategory>([
      [10, 'strength'],
      [11, 'cardio'],
    ])
    const stats = deriveAchievementStats({
      workouts: [],
      prs: [],
      completedSets: [
        makeSet({ exerciseId: 10 }),
        makeSet({ id: 2, setNumber: 2, exerciseId: 10 }),
        makeSet({ id: 3, setNumber: 3, exerciseId: 11 }),
      ],
      exerciseCategories: categories,
      guideCount: 0,
      streak: emptyStreak,
      now: NOW,
    })
    expect(stats.cardioSetCount).toBe(1)
    expect(stats.completedSetCount).toBe(3)
  })

  it('cardio defensivo: serie con duración cuenta aunque falte la categoría', () => {
    const stats = deriveAchievementStats({
      workouts: [],
      prs: [],
      completedSets: [makeSet({ durationSeconds: 600, weightKg: 0, reps: 0 })],
      exerciseCategories: new Map(),
      guideCount: 0,
      streak: emptyStreak,
      now: NOW,
    })
    expect(stats.cardioSetCount).toBe(1)
  })

  it('ejercicios únicos: ids distintos de las series completadas', () => {
    const stats = deriveAchievementStats({
      workouts: [],
      prs: [],
      completedSets: [
        makeSet({ exerciseId: 1 }),
        makeSet({ id: 2, setNumber: 2, exerciseId: 1 }),
        makeSet({ id: 3, setNumber: 3, exerciseId: 2 }),
      ],
      exerciseCategories: new Map(),
      guideCount: 0,
      streak: emptyStreak,
      now: NOW,
    })
    expect(stats.uniqueExerciseCount).toBe(2)
  })

  it('racha de semanas consecutivas con huecos de 6/7/8 días entre sesiones', () => {
    // 6 días: misma semana calendario → 1 semana.
    const sixDays = deriveAchievementStats({
      workouts: [
        makeWorkout({ localDate: '2026-08-31' }),
        makeWorkout({ id: 2, localDate: '2026-09-06' }),
      ],
      prs: [],
      completedSets: [],
      exerciseCategories: new Map(),
      guideCount: 0,
      streak: emptyStreak,
      now: NOW,
    })
    expect(sixDays.longestConsistentWeekRun).toBe(1)

    // 7 días: semanas consecutivas → racha de 2.
    const sevenDays = deriveAchievementStats({
      workouts: [
        makeWorkout({ localDate: '2026-08-31' }),
        makeWorkout({ id: 2, localDate: '2026-09-07' }),
      ],
      prs: [],
      completedSets: [],
      exerciseCategories: new Map(),
      guideCount: 0,
      streak: emptyStreak,
      now: NOW,
    })
    expect(sevenDays.longestConsistentWeekRun).toBe(2)

    // 8 días: cruza al lunes siguiente → misma clave de semana que 7 días.
    const eightDays = deriveAchievementStats({
      workouts: [
        makeWorkout({ localDate: '2026-08-31' }),
        makeWorkout({ id: 2, localDate: '2026-09-08' }),
      ],
      prs: [],
      completedSets: [],
      exerciseCategories: new Map(),
      guideCount: 0,
      streak: emptyStreak,
      now: NOW,
    })
    expect(eightDays.longestConsistentWeekRun).toBe(2)
  })

  it('racha de semanas: un salto de 2 semanas rompe la racha', () => {
    const stats = deriveAchievementStats({
      workouts: [
        makeWorkout({ localDate: '2026-08-31' }),
        makeWorkout({ id: 2, localDate: '2026-09-07' }),
        makeWorkout({ id: 3, localDate: '2026-09-21' }),
      ],
      prs: [],
      completedSets: [],
      exerciseCategories: new Map(),
      guideCount: 0,
      streak: emptyStreak,
      now: NOW,
    })
    expect(stats.longestConsistentWeekRun).toBe(2)
  })

  it('racha más larga del streak se propaga al bag', () => {
    const stats = deriveAchievementStats({
      workouts: [],
      prs: [],
      completedSets: [],
      exerciseCategories: new Map(),
      guideCount: 0,
      streak: { currentStreak: 2, longestStreak: 9, lastWorkoutDate: null },
      now: NOW,
    })
    expect(stats.longestStreak).toBe(9)
  })

  it('primer-ano: piso de días desde la primera sesión, capado a 365', () => {
    // 400 días → 365 (cap).
    const capped = deriveAchievementStats({
      workouts: [makeWorkout({ startedAt: '2025-08-09T12:00:00.000Z', localDate: '2025-08-09' })],
      prs: [],
      completedSets: [],
      exerciseCategories: new Map(),
      guideCount: 0,
      streak: emptyStreak,
      now: NOW,
    })
    expect(capped.daysSinceFirstWorkout).toBe(365)

    // Exactamente 365 días → 365 (completado).
    const exact = deriveAchievementStats({
      workouts: [makeWorkout({ startedAt: '2025-09-13T12:00:00.000Z', localDate: '2025-09-13' })],
      prs: [],
      completedSets: [],
      exerciseCategories: new Map(),
      guideCount: 0,
      streak: emptyStreak,
      now: NOW,
    })
    expect(exact.daysSinceFirstWorkout).toBe(365)

    // 364 días → 364 (un día menos).
    const under = deriveAchievementStats({
      workouts: [makeWorkout({ startedAt: '2025-09-14T12:00:00.000Z', localDate: '2025-09-14' })],
      prs: [],
      completedSets: [],
      exerciseCategories: new Map(),
      guideCount: 0,
      streak: emptyStreak,
      now: NOW,
    })
    expect(under.daysSinceFirstWorkout).toBe(364)
  })

  it('tres sesiones de una semana pasada suben completedChallengeCount (primer-reto)', () => {
    const pastWeek = weekStartKey(addLocalDays(toLocalDateStr(), -21))
    const stats = deriveAchievementStats({
      workouts: [
        makeWorkout({ id: 1, localDate: pastWeek, startedAt: `${pastWeek}T10:00:00.000Z` }),
        makeWorkout({ id: 2, localDate: addLocalDays(pastWeek, 1), startedAt: `${addLocalDays(pastWeek, 1)}T10:00:00.000Z` }),
        makeWorkout({ id: 3, localDate: addLocalDays(pastWeek, 2), startedAt: `${addLocalDays(pastWeek, 2)}T10:00:00.000Z` }),
      ],
      prs: [],
      completedSets: [],
      exerciseCategories: new Map(),
      guideCount: 0,
      streak: emptyStreak,
      now: NOW,
    })
    expect(stats.completedChallengeCount).toBeGreaterThanOrEqual(1)
    expect(achievementProgress('primer-reto', stats).completed).toBe(true)
  })

  // F120/A1: el único consumidor (primer-reto) tiene target 1; el bag se corta
  // ahí para no pasear todo el historial contando retos que nadie va a leer.
  it('el conteo histórico de retos se capa en el tope del consumidor', () => {
    const pastWeek = weekStartKey(addLocalDays(toLocalDateStr(), -21))
    // Cuatro sesiones consecutivas en la semana pasada: freq-3 (4 ≥ 3) y
    // dias-4 (racha diaria 4) son dos retos distintos.
    const workouts = [0, 1, 2, 3].map((offset) =>
      makeWorkout({
        id: offset + 1,
        localDate: addLocalDays(pastWeek, offset),
        startedAt: `${addLocalDays(pastWeek, offset)}T10:00:00.000Z`,
      }),
    )
    const stats = deriveAchievementStats({
      workouts,
      prs: [],
      completedSets: [],
      exerciseCategories: new Map(),
      guideCount: 0,
      streak: emptyStreak,
      now: NOW,
    })
    expect(stats.completedChallengeCount).toBe(1)
    expect(achievementProgress('primer-reto', stats).completed).toBe(true)
  })
})

// ─── Split del bag de stats (F120/P2) ─────────────────────────────

describe('deriveAchievementStatsCore / deriveAchievementStatsSteps', () => {
  it('core + medidas de pasos reconstruyen el bag completo', () => {
    const input = {
      workouts: [
        makeWorkout({ id: 1 }),
        makeWorkout({ id: 2, localDate: '2026-09-10', startedAt: '2026-09-10T10:00:00.000Z', finishedAt: '2026-09-10T11:30:00.000Z' }),
      ],
      prs: [makePR()],
      completedSets: [makeSet()],
      exerciseCategories: new Map<number, ExerciseCategory>([[10, 'strength']]),
      guideCount: 4,
      streak: { currentStreak: 1, longestStreak: 2, lastWorkoutDate: '2026-09-13' } as StreakResult,
      now: NOW,
      stepDays: [makeStepDay({ localDate: '2026-09-01', steps: 12_000, distanceKm: 8 })],
      exerciseMuscles: new Map<number, MuscleGroup>([[10, 'pecho']]),
      meals: [makeMeal()],
      bodyWeights: [makeBodyWeight()],
      photoCount: 1,
    }
    const assembled = {
      ...deriveAchievementStatsCore(input),
      ...deriveAchievementStatsSteps(input),
    }
    expect(assembled).toEqual(deriveAchievementStats(input))
  })
})

// ─── Progreso de todos los logros ────────────────────────────────

describe('progressForAll', () => {
  it('devuelve las 36 entradas alineadas con el mapa', () => {
    expect(Object.keys(progressForAll(makeStats())).sort()).toEqual(ALL_IDS)
  })

  it('estado vacío: ninguna completada y todos los valores numéricos', () => {
    for (const p of Object.values(progressForAll(makeStats()))) {
      expect(p.completed).toBe(false)
      expect(Number.isFinite(p.current)).toBe(true)
      expect(Number.isFinite(p.target)).toBe(true)
    }
  })

  it('refleja una mezcla: cardio y racha cumplidas, sesiones a medias', () => {
    const progress = progressForAll(makeStats({ workoutCount: 30, longestStreak: 4, cardioSetCount: 1 }))
    expect(progress['primera-cardio']!.completed).toBe(true)
    expect(progress['racha-4']!.completed).toBe(true)
    expect(progress['sesiones-50']!.completed).toBe(false)
    expect(progress['sesiones-50']!.current).toBe(30)
  })
})

// F109.1: el delta de PR se deriva del historial real de series (la tabla de
// PRs pisa una fila por ejercicio y nunca podía dar un delta).
describe('maxPrDeltaKg desde completedSets', () => {
  const set = (id: number, exerciseId: number, weightKg: number, createdAt: string, isWarmup = false): WorkoutSet =>
    ({
      id,
      workoutId: 1,
      exerciseId,
      setNumber: 1,
      weightKg,
      reps: 8,
      completed: true,
      createdAt,
      isWarmup,
    }) as WorkoutSet

  const base = {
    workouts: [],
    prs: [],
    exerciseCategories: new Map(),
    guideCount: 0,
    // Fixture real del archivo (StreakResult): el shape del brief (`weekKeys`,
    // `as never`) no existe en el dominio.
    streak: emptyStreak,
    now: new Date('2026-09-27T12:00:00.000Z'),
  }

  it('sin historial el delta es 0', () => {
    expect(deriveAchievementStats({ ...base, completedSets: [] }).maxPrDeltaKg).toBe(0)
  })

  it('primera serie vs. mejor peso posterior por ejercicio', () => {
    const stats = deriveAchievementStats({
      ...base,
      completedSets: [
        set(1, 101, 40, '2026-01-01T10:00:00.000Z'),
        set(2, 101, 55, '2026-06-01T10:00:00.000Z'),
      ],
    })
    expect(stats.maxPrDeltaKg).toBe(15)
  })

  it('excluye warmups y peso 0: si se contaran, el delta sería mayor (fixture sensible al filtro)', () => {
    const stats = deriveAchievementStats({
      ...base,
      completedSets: [
        // Warmup 10 kg más temprano que el trabajo 80→82: si contara, el delta
        // sería 72 (10→82) en vez del real 2 (80→82).
        set(1, 101, 10, '2026-01-01T10:00:00.000Z', true),
        set(2, 101, 80, '2026-01-02T10:00:00.000Z'),
        set(3, 101, 82, '2026-03-02T10:00:00.000Z'),
        // Peso corporal (0 kg) al inicio: si contara, el delta sería 35 (0→35).
        set(4, 202, 0, '2026-01-01T10:00:00.000Z'),
        set(5, 202, 30, '2026-02-01T10:00:00.000Z'),
        set(6, 202, 35, '2026-02-02T10:00:00.000Z'),
        // El máximo real entre los ejercicios filtrados es 27 (20→47).
        set(7, 303, 20, '2026-01-02T10:00:00.000Z'),
        set(8, 303, 47, '2026-03-02T10:00:00.000Z'),
      ],
    })
    expect(stats.maxPrDeltaKg).toBe(27)
  })

  it('ordena por instante real aunque los createdAt traigan offsets distintos', () => {
    // '2026-01-02T00:30:00+02:00' es anterior en tiempo (2026-01-01T22:30Z) a
    // '2026-01-01T23:00:00Z'; comparar por string los ordena al revés y el
    // delta saldría 0 (base 80) en vez de 30 (base 50).
    const stats = deriveAchievementStats({
      ...base,
      completedSets: [
        set(1, 101, 50, '2026-01-02T00:30:00+02:00'),
        set(2, 101, 80, '2026-01-01T23:00:00Z'),
      ],
    })
    expect(stats.maxPrDeltaKg).toBe(30)
  })
})

// ─── Medidas de familias nuevas (F109.2) ─────────────────────────

describe('deriveMealStats (F109.2)', () => {
  it('cuenta registros, días distintos, racha de días seguidos y pico diario de proteína', () => {
    const meals = [
      mealWithProtein(1, '2026-09-01', 40),
      mealWithProtein(2, '2026-09-02', 60),
      mealWithProtein(3, '2026-09-03', 20),
      mealWithProtein(4, '2026-09-03', 30), // 09-03 suma 50 entre dos comidas
      mealWithProtein(5, '2026-09-10', 50),
    ]
    const stats = deriveMealStats(meals)
    expect(stats.mealsRegisteredCount).toBe(5)
    expect(stats.mealDaysDistinct).toBe(4) // 01, 02, 03, 10
    expect(stats.consecutiveMealDays).toBe(3) // 01→02→03
    // El pico diario es 09-02 (60) y no 09-03 (20+30=50): el ejemplo del brief
    // esperaba 50, pero sus propios datos tienen 60 el 02.
    expect(stats.maxDailyProteinG).toBe(60)
  })

  it('sin comidas → todos los contadores a 0, sin NaN', () => {
    expect(deriveMealStats([])).toEqual({
      mealsRegisteredCount: 0,
      consecutiveMealDays: 0,
      maxDailyProteinG: 0,
      mealDaysDistinct: 0,
    })
  })
})

describe('medidas de familias nuevas (F109.2)', () => {
  const baseInput = {
    workouts: [] as Workout[],
    prs: [] as PRRecord[],
    completedSets: [] as WorkoutSet[],
    exerciseCategories: new Map<number, ExerciseCategory>(),
    guideCount: 0,
    streak: emptyStreak,
    now: NOW,
  }

  it('bodyWeightCount es longitud y progressPhotoCount el conteo liviano', () => {
    const stats = deriveAchievementStats({
      ...baseInput,
      bodyWeights: [makeBodyWeight(), makeBodyWeight({ id: 2 }), makeBodyWeight({ id: 3 })],
      photoCount: 2,
    })
    expect(stats.bodyWeightCount).toBe(3)
    expect(stats.progressPhotoCount).toBe(2)
  })

  it('longestDailyWorkoutRun: mejor racha de días consecutivos con sesión', () => {
    const stats = deriveAchievementStats({
      ...baseInput,
      workouts: [
        makeWorkout({ id: 1, localDate: '2026-09-01' }),
        makeWorkout({ id: 2, localDate: '2026-09-02' }),
        makeWorkout({ id: 3, localDate: '2026-09-03' }),
        makeWorkout({ id: 4, localDate: '2026-09-08' }),
      ],
    })
    expect(stats.longestDailyWorkoutRun).toBe(3)
  })

  it('longestSessionMin: mayor sesión finalizada; las en curso no cuentan', () => {
    const stats = deriveAchievementStats({
      ...baseInput,
      workouts: [
        makeWorkout({ id: 1, startedAt: '2026-09-01T10:00:00.000Z', finishedAt: '2026-09-01T11:35:00.000Z' }),
        makeWorkout({ id: 2, startedAt: '2026-09-02T10:00:00.000Z', finishedAt: '2026-09-02T11:00:00.000Z' }),
        makeWorkout({ id: 3, finishedAt: null }),
      ],
    })
    expect(stats.longestSessionMin).toBe(95)
  })

  it('cardioTotalSeconds: suma solo las series cardio (misma regla que cardioSetCount)', () => {
    const stats = deriveAchievementStats({
      ...baseInput,
      exerciseCategories: new Map<number, ExerciseCategory>([
        [10, 'strength'],
        [11, 'cardio'],
      ]),
      completedSets: [
        makeSet({ id: 1, exerciseId: 11, durationSeconds: 600, weightKg: 0, reps: 0 }),
        makeSet({ id: 2, setNumber: 2, exerciseId: 11, durationSeconds: 1800, weightKg: 0, reps: 0 }),
        makeSet({ id: 3, setNumber: 3, exerciseId: 10, durationSeconds: 900 }), // fuerza con duración: fuera
      ],
    })
    expect(stats.cardioSetCount).toBe(2)
    expect(stats.cardioTotalSeconds).toBe(2400)
  })

  it('stepsDistanceKm: acumula la distancia del histórico de pasos', () => {
    const stats = deriveAchievementStats({
      ...baseInput,
      stepDays: [
        makeStepDay({ localDate: '2026-09-01', steps: 10_000, distanceKm: 7.5 }),
        makeStepDay({ id: 2, localDate: '2026-09-02', steps: 11_000, distanceKm: 8.1 }),
      ],
    })
    expect(stats.stepsDistanceKm).toBe(15.6)
  })

  it('el mapa declara las 12 medallas nuevas con su medida y target exactos', () => {
    const expected: Array<[string, MeasureKey, number]> = [
      ['nutricion-primera', 'mealsRegisteredCount', 1],
      ['nutricion-semana', 'consecutiveMealDays', 7],
      ['nutricion-proteina', 'maxDailyProteinG', 150],
      ['nutricion-30-dias', 'mealDaysDistinct', 30],
      ['cuerpo-primer-peso', 'bodyWeightCount', 1],
      ['cuerpo-30-pesos', 'bodyWeightCount', 30],
      ['cuerpo-10-fotos', 'progressPhotoCount', 10],
      ['entreno-5-dias', 'longestDailyWorkoutRun', 5],
      ['entreno-90min', 'longestSessionMin', 90],
      ['entreno-12-semanas', 'longestConsistentWeekRun', 12],
      ['cardio-60min', 'cardioTotalSeconds', 3600],
      ['pasos-50km', 'stepsDistanceKm', 50],
    ]
    for (const [id, measure, target] of expected) {
      expect(ACHIEVEMENT_PROGRESS[id]).toEqual({ measure, target })
    }
  })

  it('las barras nuevas se completan al alcanzar sus umbrales', () => {
    expect(achievementProgress('nutricion-primera', makeStats({ mealsRegisteredCount: 1 })).completed).toBe(true)
    expect(achievementProgress('cuerpo-10-fotos', makeStats({ progressPhotoCount: 9 })).completed).toBe(false)
    expect(achievementProgress('entreno-90min', makeStats({ longestSessionMin: 90 })).completed).toBe(true)
    expect(achievementProgress('entreno-12-semanas', makeStats({ longestConsistentWeekRun: 12 })).completed).toBe(true)
    expect(achievementProgress('cardio-60min', makeStats({ cardioTotalSeconds: 3599 })).completed).toBe(false)
    expect(achievementProgress('pasos-50km', makeStats({ stepsDistanceKm: 50 })).completed).toBe(true)
  })
})