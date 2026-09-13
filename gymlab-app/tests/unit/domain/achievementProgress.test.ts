// Tests del progreso declarativo de logros (F95.3): el mapa ACHIEVEMENT_PROGRESS
// es la fuente única de current/target/completed para las barras de /logros y
// para la evaluación de checkAchievements. La derivación de stats es pura y
// recibe `now` inyectado para que primer-ano sea determinista.
import { describe, expect, it } from 'vitest'
import {
  ACHIEVEMENT_PROGRESS,
  achievementProgress,
  deriveAchievementStats,
  progressForAll,
  type AchievementStats,
} from '@/domain/achievementProgress'
import { ACHIEVEMENTS } from '@/domain/achievements'
import type { ExerciseCategory, PRRecord, StreakResult, Workout, WorkoutSet } from '@/domain/types'

// Los 15 ids del catálogo (fuente de verdad del mapa).
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
  ...overrides,
})

// now fijo para que los días transcurridos (primer-ano) no dependan del reloj.
const NOW = new Date('2026-09-13T12:00:00.000Z')

// ─── Mapa declarativo ─────────────────────────────────────────────

describe('ACHIEVEMENT_PROGRESS', () => {
  it('cubre exactamente los 15 ids del catálogo', () => {
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

  it('máximo delta PR por ejercicio: último − primero por fecha; 0 sin historial previo', () => {
    const stats = deriveAchievementStats({
      workouts: [],
      prs: [
        makePR({ exerciseId: 10, weightKg: 100, date: '2026-01-01T10:00:00.000Z' }),
        makePR({ exerciseId: 10, weightKg: 115, date: '2026-02-01T10:00:00.000Z' }),
        makePR({ exerciseId: 11, weightKg: 90, date: '2026-03-01T10:00:00.000Z' }),
      ],
      completedSets: [],
      exerciseCategories: new Map(),
      guideCount: 0,
      streak: emptyStreak,
      now: NOW,
    })
    expect(stats.maxPrDeltaKg).toBe(15)
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
})

// ─── Progreso de todos los logros ────────────────────────────────

describe('progressForAll', () => {
  it('devuelve las 15 entradas alineadas con el mapa', () => {
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