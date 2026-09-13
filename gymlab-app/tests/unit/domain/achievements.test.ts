// Tests del dominio de logros: tiers por rareza, contador transicional
// (veces conseguido) para las chapas-medalla estilo BO2 y evaluación de
// checkAchievements sobre el stats bag (F95.3: condiciones en el mapa
// declarativo ACHIEVEMENT_PROGRESS, no en literales sueltos).
import { describe, expect, it } from 'vitest'
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_TIERS,
  checkAchievements,
  type AchievementTier,
  nextAchievementCounts,
} from '@/domain/achievements'
import { deriveAchievementStats, type AchievementStats } from '@/domain/achievementProgress'
import type { ExerciseCategory, PRRecord, StreakResult, Workout, WorkoutSet } from '@/domain/types'

const VALID_TIERS: AchievementTier[] = ['bronze', 'silver', 'gold', 'platinum']

// Bag de stats con todos los contadores en 0; cada test sobrescribe lo que prueba.
const mockStats = (overrides: Partial<AchievementStats> = {}): AchievementStats => ({
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

// now fijo para la derivación integrada (primer-ano no depende del reloj).
const NOW = new Date('2026-09-11T12:00:00.000Z')

const makeWorkout = (overrides: Partial<Workout> = {}): Workout => ({
  id: 1,
  startedAt: '2026-09-11T10:00:00.000Z',
  finishedAt: '2026-09-11T11:00:00.000Z',
  routineId: null,
  routineDayId: null,
  localDate: '2026-09-11',
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
  createdAt: '2026-09-11T10:05:00.000Z',
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

describe('ACHIEVEMENT_TIERS', () => {
  it('existe un tier para los 15 logros', () => {
    expect(Object.keys(ACHIEVEMENT_TIERS)).toHaveLength(ACHIEVEMENTS.length)
    for (const a of ACHIEVEMENTS) {
      expect(ACHIEVEMENT_TIERS[a.id]).toBeDefined()
    }
  })

  it('todos los tiers son válidos', () => {
    for (const a of ACHIEVEMENTS) {
      expect(VALID_TIERS).toContain(ACHIEVEMENT_TIERS[a.id])
    }
  })

  it('escala de dificultad: primer-paso es bronce y sesiones-500/primer-ano son platino', () => {
    expect(ACHIEVEMENT_TIERS['primer-paso']).toBe('bronze')
    expect(ACHIEVEMENT_TIERS['sesiones-500']).toBe('platinum')
    expect(ACHIEVEMENT_TIERS['primer-ano']).toBe('platinum')
  })
})

describe('nextAchievementCounts', () => {
  it('cuenta 1 para logros recién conseguidos y devuelve el snapshot nuevo', () => {
    const prev = { counts: {}, snapshot: [] }
    const next = nextAchievementCounts(prev, ['primer-paso', 'inaugural'])
    expect(next.counts).toEqual({ 'primer-paso': 1, inaugural: 1 })
    expect(next.snapshot).toEqual(['primer-paso', 'inaugural'])
  })

  it('no infla el contador si el logro sigue conseguido', () => {
    const prev = {
      counts: { 'primer-paso': 1, inaugural: 1 },
      snapshot: ['primer-paso', 'inaugural'],
    }
    const next = nextAchievementCounts(prev, ['primer-paso', 'inaugural', 'racha-4'])
    expect(next.counts).toEqual({ 'primer-paso': 1, inaugural: 1, 'racha-4': 1 })
  })

  it('suma otra vez cuando un logro vuelve a conseguirse tras perderse', () => {
    const prev = {
      counts: { 'volumen-semanal': 1 },
      snapshot: [], // la semana desapareció y volvió a superarse
    }
    const next = nextAchievementCounts(prev, ['volumen-semanal'])
    expect(next.counts['volumen-semanal']).toBe(2)
  })

  it('mantiene contadores previos y no muta el estado pasado', () => {
    const prev = { counts: { inaugural: 3 }, snapshot: ['inaugural'] }
    const next = nextAchievementCounts(prev, ['primer-paso'])
    expect(next.counts).toEqual({ inaugural: 3, 'primer-paso': 1 })
    expect(prev.counts).toEqual({ inaugural: 3 })
    expect(prev.snapshot).toEqual(['inaugural'])
  })
})

// ─── Evaluación sobre el stats bag (F95.3) ─────────────────────────

describe('checkAchievements', () => {
  it('sin datos no desbloquea nada', () => {
    expect(checkAchievements(mockStats())).toEqual([])
  })

  it('primera serie completada y primera sesión → primer-paso + inaugural', () => {
    const ids = checkAchievements(mockStats({ completedSetCount: 1, workoutCount: 1 }))
    expect(ids).toContain('primer-paso')
    expect(ids).toContain('inaugural')
  })

  it('solo fuerza: series completadas no desbloquean primera-cardio (0/1)', () => {
    const ids = checkAchievements(mockStats({ completedSetCount: 3, cardioSetCount: 0 }))
    expect(ids).toContain('primer-paso')
    expect(ids).not.toContain('primera-cardio')
  })

  it('una serie cardio sí desbloquea primera-cardio', () => {
    const ids = checkAchievements(mockStats({ completedSetCount: 1, cardioSetCount: 1 }))
    expect(ids).toContain('primera-cardio')
  })

  it('racha histórica: 4, 8 y 16 semanas desbloquean sus hitos', () => {
    expect(checkAchievements(mockStats({ longestStreak: 4 }))).toContain('racha-4')
    expect(checkAchievements(mockStats({ longestStreak: 8 }))).toContain('racha-8')
    expect(checkAchievements(mockStats({ longestStreak: 16 }))).toContain('racha-16')
  })

  it('no-monótono: el mejor histórico (9) mantiene racha-8 sin desbloquear racha-16', () => {
    const ids = checkAchievements(mockStats({ longestStreak: 9 }))
    expect(ids).toContain('racha-8')
    expect(ids).not.toContain('racha-16')
  })

  it('4 semanas consecutivas de entreno desbloquean consistencia-4s', () => {
    const ids = checkAchievements(mockStats({ longestConsistentWeekRun: 4 }))
    expect(ids).toContain('consistencia-4s')
  })

  it('un PR desbloquea primera-marca; +10kg de delta desbloquea pr-10kg', () => {
    expect(checkAchievements(mockStats({ prCount: 1 }))).toContain('primera-marca')
    expect(checkAchievements(mockStats({ prCount: 2, maxPrDeltaKg: 15 }))).toContain('pr-10kg')
  })

  it('10 000 kg de volumen semanal (límite inclusive) desbloquean volumen-semanal', () => {
    expect(checkAchievements(mockStats({ maxWeeklyVolume: 10_000 }))).toContain('volumen-semanal')
    expect(checkAchievements(mockStats({ maxWeeklyVolume: 9_999 }))).not.toContain('volumen-semanal')
  })

  it('50 y 500 sesiones desbloquean sus hitos', () => {
    expect(checkAchievements(mockStats({ workoutCount: 50 }))).toContain('sesiones-50')
    expect(checkAchievements(mockStats({ workoutCount: 500 }))).toContain('sesiones-500')
  })

  it('100 ejercicios distintos desbloquean ejercicios-100', () => {
    expect(checkAchievements(mockStats({ uniqueExerciseCount: 100 }))).toContain('ejercicios-100')
  })

  it('guias-completas no se concede sin señal de completado (current 0 siempre)', () => {
    const ids = checkAchievements(mockStats({ guideCount: 12, completedGuidesCount: 0 }))
    expect(ids).not.toContain('guias-completas')
  })

  it('guias-completas se concede cuando la señal futura iguala las guías disponibles', () => {
    const ids = checkAchievements(mockStats({ guideCount: 12, completedGuidesCount: 12 }))
    expect(ids).toContain('guias-completas')
  })

  it('primer-ano: 365 días desde la primera sesión desbloquean el hito', () => {
    expect(checkAchievements(mockStats({ daysSinceFirstWorkout: 365 }))).toContain('primer-ano')
    expect(checkAchievements(mockStats({ daysSinceFirstWorkout: 364 }))).not.toContain('primer-ano')
  })

  it('integración: deriva stats reales con now inyectado y evalúa cardio + primer-ano', () => {
    const categories = new Map<number, ExerciseCategory>([[10, 'cardio']])
    const stats = deriveAchievementStats({
      workouts: [makeWorkout({ startedAt: '2025-09-11T12:00:00.000Z', localDate: '2025-09-11' })],
      prs: [makePR()],
      completedSets: [makeSet({ durationSeconds: 1200, weightKg: 0, reps: 0 })],
      exerciseCategories: categories,
      guideCount: 0,
      streak: emptyStreak,
      now: NOW,
    })
    const ids = checkAchievements(stats)
    expect(ids).toContain('primera-cardio')
    expect(ids).toContain('primer-ano')
    expect(ids).toContain('primera-marca')
    expect(ids).toContain('inaugural')
  })
})