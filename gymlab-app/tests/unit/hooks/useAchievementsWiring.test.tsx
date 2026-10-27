// @vitest-environment jsdom
// R3-REL-002 (lote-18): la delegación del host en `persistAchievementPatch` deja
// de estar pinneada por TEXTO en achievementsDataSource.test.ts y pasa a
// CONDUCTA sobre el hook real: fake timers observan el debounce de 600 ms, el
// repo espía recibe exactamente los 4 pares del patch en orden (la delegación
// REAL corre, sin mock) y cada delta cae en su setter — variantDelta → newGranted
// y freshIds mapeados → achievements. Un cruce de claves o de setters falla acá.
// Es cobertura del comportamiento EXISTENTE: verde de entrada, documentado.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { AchievementStats } from '@/domain/achievementProgress'
import type { AchievementsData } from '@/hooks/useAchievementsData'
import type { ExerciseCategory, MuscleGroup } from '@/domain/types'
import {
  ACHIEVEMENT_COUNTS_KEY,
  ACHIEVEMENT_SNAPSHOT_KEY,
  COLLECTIBLES_KEY,
  UNLOCKED_ACHIEVEMENTS_KEY,
  useAchievements,
} from '@/hooks/useAchievements'

// El audit de fuente pinnea `EVALUATION_DEBOUNCE_MS = 600` por texto; acá se
// pinnea por conducta: recién a los 600 ms el effect delega las escrituras.
const DEBOUNCE_MS = 600

// Fixture compartido por los mocks (hoisted: corren antes de los imports).
// unlocked ≠ snapshot y freshIds ≠ variantDelta: un misroute deja de ser
// invisible. Referencias estables de módulo: el effect no debe re-dispararse.
const ctx = vi.hoisted(() => {
  const setJson = vi.fn((_key: string, _value: unknown) => Promise.resolve())
  const patch = {
    unlocked: ['patch-unlocked'],
    counts: { 'patch-counts': 7 },
    snapshot: ['patch-snapshot'],
    collectibles: [{ achievementId: 'patch-collectible', variantId: 'oro' }],
  }
  const freshIds = ['fresh-1', 'fresh-2']
  const variantDelta = [{ achievementId: 'variant-1', variantId: 'plata' }]
  const evaluateAchievementPersistence = vi.fn(() => ({ patch, freshIds, variantDelta }))
  const data: AchievementsData = {
    ready: true,
    workouts: [],
    prs: [],
    bestPrs: [],
    completedSets: [],
    savedIds: [],
    counts: {},
    snapshot: [],
    collectibles: [],
    stepDays: [],
    meals: [],
    bodyWeights: [],
    photoCount: 0,
    exerciseCategories: new Map<number, ExerciseCategory>(),
    exerciseMuscles: new Map<number, MuscleGroup>(),
    guideCount: 0,
    streak: { currentStreak: 0, longestStreak: 1, lastWorkoutDate: null },
    // El bag solo se reenvía a checkAchievements (mockeado): no hace falta derivarlo.
    stats: {} as AchievementStats,
    progress: {},
  }
  return { setJson, patch, freshIds, variantDelta, evaluateAchievementPersistence, data }
})

// importOriginal conserva las constantes reales de claves y solo se sobreescribe
// el hook de datos: las escrituras del patch quedan observables en el repo espía.
vi.mock('@/hooks/useAchievementsData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useAchievementsData')>()
  return { ...actual, useAchievementsData: () => ctx.data }
})

vi.mock('@/data/repositories', () => ({ metaRepo: { setJson: ctx.setJson } }))

// La secuencia de dominio se fija: se mide el wiring del hook, no el cálculo.
vi.mock('@/domain/achievementReconcile', () => ({
  evaluateAchievementPersistence: ctx.evaluateAchievementPersistence,
}))

// Catálogo real fuera: ids fijos y mapeo observable de getAchievement.
vi.mock('@/domain/achievements', () => ({
  checkAchievements: () => [...ctx.freshIds],
  getAchievement: (id: string) => ({
    id,
    titleKey: `logros.${id}`,
    descriptionKey: `logros.${id}.detalle`,
    icon: 'trophy',
  }),
}))

describe('useAchievements — wiring del effect debounced (R3-REL-002)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    // El fixture vive a nivel módulo: devolver savedIds a su valor inicial para
    // que la firma del effect arranque igual en cada test.
    ctx.data.savedIds = []
  })

  afterEach(() => {
    // El repo no usa `globals: true`: RTL no auto-limpia; los timers vuelven a real.
    cleanup()
    vi.useRealTimers()
  })

  it('a los 600 ms delega en persistAchievementPatch y cada delta va a su setter', () => {
    const { result } = renderHook(() => useAchievements())

    // (1) Debounce por conducta: el mount no escribe meta.
    expect(ctx.setJson).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(DEBOUNCE_MS))

    // (2) Los 4 pares del patch, en orden (la delegación REAL corrió).
    expect(ctx.setJson.mock.calls).toEqual([
      [UNLOCKED_ACHIEVEMENTS_KEY, ctx.patch.unlocked],
      [ACHIEVEMENT_COUNTS_KEY, ctx.patch.counts],
      [ACHIEVEMENT_SNAPSHOT_KEY, ctx.patch.snapshot],
      [COLLECTIBLES_KEY, ctx.patch.collectibles],
    ])
    // (3) Una sola evaluación: el dueño de la secuencia corre una vez.
    expect(ctx.evaluateAchievementPersistence).toHaveBeenCalledTimes(1)

    // (4) Sin cruce de setters: las chapas nuevas al anuncio y los ids frescos
    // (mapeados por getAchievement) acumulados en achievements.
    expect(result.current.newGranted).toBe(ctx.variantDelta)
    expect(result.current.achievements.map((a) => a.id)).toEqual(ctx.freshIds)
  })

  it('2ª evaluación con variantDelta vacío: no pisa el anuncio y dedupea achievements', () => {
    const { result, rerender } = renderHook(() => useAchievements())

    // Primera evaluación (mismo camino que el it anterior): anuncio + 2 ids frescos.
    act(() => vi.advanceTimersByTime(DEBOUNCE_MS))
    expect(ctx.evaluateAchievementPersistence).toHaveBeenCalledTimes(1)
    expect(result.current.newGranted).toBe(ctx.variantDelta)
    expect(result.current.achievements.map((a) => a.id)).toEqual(ctx.freshIds)

    // Segunda evaluación con variantDelta VACÍO y los MISMOS freshIds: el guard
    // de longitud no debe pisar el anuncio pendiente y el dedupe no debe
    // acumular duplicados en achievements.
    ctx.evaluateAchievementPersistence.mockImplementationOnce(() => ({
      patch: ctx.patch,
      freshIds: ctx.freshIds,
      variantDelta: [],
    }))
    // savedIds cambia de array (vacío → 1 elemento): la firma del effect cambia
    // y la 2ª evaluación se dispara sobre el MISMO hook montado.
    ctx.data.savedIds = ['saved-1']
    rerender()
    act(() => vi.advanceTimersByTime(DEBOUNCE_MS))

    expect(ctx.evaluateAchievementPersistence).toHaveBeenCalledTimes(2)
    expect(result.current.newGranted).toBe(ctx.variantDelta)
    expect(result.current.achievements.map((a) => a.id)).toEqual(['fresh-1', 'fresh-2'])
  })
})
