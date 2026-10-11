// Reconciliación de logros (F112 §5.2, D6/D7): re-bloqueo de lo no sostenido,
// contadores restringidos a earned, snapshot := earned, chapas retrocedidas de
// forma determinística y escrituras solo-si-cambió (idempotentes).
import { describe, expect, it } from 'vitest'
import {
  achievementStatePatch,
  evaluateAchievementPersistence,
  freshAchievementIds,
  newCollectibleDelta,
  reconcileAchievementState,
  type AchievementState,
} from '@/domain/achievementReconcile'

const state = (over: Partial<AchievementState> = {}): AchievementState => ({
  unlocked: [],
  counts: {},
  snapshot: [],
  collectibles: [],
  ...over,
})

describe('reconcileAchievementState', () => {
  it('re-bloquea los ids que ya no se sostienen y conserva los sostenidos', () => {
    const next = reconcileAchievementState(
      state({
        unlocked: ['primer-paso', 'inaugural'],
        counts: { 'primer-paso': 1, inaugural: 1 },
        snapshot: ['primer-paso', 'inaugural'],
      }),
      ['primer-paso'],
    )
    expect(next.unlocked).toEqual(['primer-paso'])
    expect(next.counts).toEqual({ 'primer-paso': 1 })
    expect(next.snapshot).toEqual(['primer-paso'])
  })

  it('un re-bloqueo pierde su contador: el re-logro arranca fresco ×1', () => {
    const lost = reconcileAchievementState(
      state({ unlocked: ['volumen-semanal'], counts: { 'volumen-semanal': 3 }, snapshot: ['volumen-semanal'] }),
      [],
    )
    expect(lost.counts).toEqual({})
    expect(lost.unlocked).toEqual([])
  })

  it('las chapas retroceden de forma determinística al perderse el contador', () => {
    const withVariants = state({
      unlocked: ['primer-paso'],
      counts: { 'primer-paso': 3 },
      snapshot: ['primer-paso'],
      collectibles: [
        { achievementId: 'primer-paso', variantId: 'polished' },
        { achievementId: 'primer-paso', variantId: 'radiant' },
      ],
    })
    const lost = reconcileAchievementState(withVariants, [])
    expect(lost.collectibles).toEqual([])
    // Contador fresco ×1 ⇒ sin variantes; ×2 vuelve a conceder la primera.
    const regained = reconcileAchievementState({ ...lost, counts: { 'primer-paso': 1 } }, ['primer-paso'])
    expect(regained.collectibles).toEqual([])
    const again = reconcileAchievementState({ ...regained, counts: { 'primer-paso': 2 } }, ['primer-paso'])
    expect(again.collectibles).toEqual([{ achievementId: 'primer-paso', variantId: 'polished' }])
  })

  it('es idempotente: aplicarlo dos veces da el mismo estado', () => {
    const first = reconcileAchievementState(state({ unlocked: ['a', 'b'], counts: { a: 1, b: 2 } }), ['b'])
    const second = reconcileAchievementState(first, ['b'])
    expect(second).toEqual(first)
  })
})

describe('freshAchievementIds (sin flood de modales)', () => {
  it('no anuncia nada al re-bloquear', () => {
    expect(freshAchievementIds(['primer-paso'], ['primer-paso', 'inaugural'])).toEqual([])
  })

  it('anuncia solo los ids ganados que no estaban persistidos', () => {
    expect(freshAchievementIds(['primer-paso', 'inaugural'], ['primer-paso'])).toEqual(['inaugural'])
  })

  it('tras un re-logro, el id vuelve a anunciarse (ya no está en savedIds)', () => {
    expect(freshAchievementIds(['primer-paso'], [])).toEqual(['primer-paso'])
  })
})

describe('newCollectibleDelta', () => {
  it('sin cambios respecto del estado previo no anuncia nada', () => {
    const granted = [{ achievementId: 'primer-paso', variantId: 'polished' }]
    expect(newCollectibleDelta(granted, granted)).toEqual([])
  })

  it('anuncia la variante re-concedida tras un retroceso', () => {
    expect(newCollectibleDelta([], [{ achievementId: 'primer-paso', variantId: 'polished' }])).toEqual([
      { achievementId: 'primer-paso', variantId: 'polished' },
    ])
  })

  it('con retroceso sin re-logro no hay delta (no anuncia variantes perdidas)', () => {
    const before = [
      { achievementId: 'primer-paso', variantId: 'polished' },
      { achievementId: 'primer-paso', variantId: 'radiant' },
    ]
    expect(newCollectibleDelta(before, [])).toEqual([])
  })
})

describe('achievementStatePatch (escrituras solo-si-cambió)', () => {
  it('estado idéntico ⇒ patch vacío (sin loops de escritura)', () => {
    const s = state({
      unlocked: ['a'],
      counts: { a: 1 },
      snapshot: ['a'],
      collectibles: [{ achievementId: 'a', variantId: 'polished' }],
    })
    expect(
      achievementStatePatch(s, {
        ...s,
        unlocked: [...s.unlocked],
        counts: { ...s.counts },
        snapshot: [...s.snapshot],
        collectibles: [...s.collectibles],
      }),
    ).toEqual({})
  })

  it('marca cada clave que cambió', () => {
    const prev = state({ unlocked: ['a', 'b'], counts: { a: 1, b: 1 }, snapshot: ['a', 'b'] })
    const next = state({ unlocked: ['a'], counts: { a: 1 }, snapshot: ['a'] })
    expect(achievementStatePatch(prev, next)).toEqual({ unlocked: ['a'], counts: { a: 1 }, snapshot: ['a'] })
  })

  // T5/R3-2: el patch también ejercita collectibles (retroceso y re-concesión).
  it('marca collectibles cuando cambian (retroceso y re-concesión)', () => {
    const polished = { achievementId: 'a', variantId: 'polished' }
    const radiant = { achievementId: 'a', variantId: 'radiant' }
    const base = { unlocked: ['a'], counts: { a: 2 }, snapshot: ['a'] }
    const withOne = state({ ...base, collectibles: [polished] })
    const withTwo = state({ ...base, collectibles: [polished, radiant] })

    expect(achievementStatePatch(withOne, withTwo)).toEqual({ collectibles: [polished, radiant] })
    expect(achievementStatePatch(withTwo, withOne)).toEqual({ collectibles: [polished] })
  })
})

// R3-T5-1: secuencia completa de persistencia del effect de useAchievements
// (contadores → reconciliación → fresh + unión → patch → delta de chapas).
describe('evaluateAchievementPersistence', () => {
  it('estado idéntico ⇒ patch vacío, sin fresh y sin delta', () => {
    const prev = state({ unlocked: ['a'], counts: { a: 1 }, snapshot: ['a'] })
    const result = evaluateAchievementPersistence(prev, ['a'])
    expect(result.patch).toEqual({})
    expect(result.freshIds).toEqual([])
    expect(result.variantDelta).toEqual([])
  })

  it('un logro nuevo entra al patch.unlocked (conservados primero, fresh al final)', () => {
    const prev = state({ unlocked: ['a'], counts: { a: 1 }, snapshot: ['a'] })
    const result = evaluateAchievementPersistence(prev, ['a', 'b'])
    expect(result.patch.unlocked).toEqual(['a', 'b'])
    expect(result.freshIds).toEqual(['b'])
    // El contador del nuevo arranca en ×1 (transición no-cumplido → cumplido).
    expect(result.patch.counts).toEqual({ a: 1, b: 1 })
  })

  it('un re-bloqueo recorta unlocked y counts, mueve snapshot y no anuncia modal', () => {
    const prev = state({ unlocked: ['a', 'b'], counts: { a: 1, b: 3 }, snapshot: ['a', 'b'] })
    const result = evaluateAchievementPersistence(prev, ['a'])
    expect(result.patch.unlocked).toEqual(['a'])
    expect(result.patch.counts).toEqual({ a: 1 })
    expect(result.patch.snapshot).toEqual(['a'])
    expect(result.freshIds).toEqual([])
  })

  it('la re-ganancia tras un re-bloqueo vuelve a anunciarse (fresh) y repone unlocked', () => {
    // Estado persistido tras el re-bloqueo de `b`: fuera de unlocked y snapshot.
    const prev = state({ unlocked: ['a', 'c'], counts: { a: 1, c: 2 }, snapshot: ['a', 'c'] })
    const result = evaluateAchievementPersistence(prev, ['a', 'c', 'b'])
    expect(result.freshIds).toEqual(['b'])
    expect(result.patch.unlocked).toEqual(['a', 'c', 'b'])
  })

  it('la variante retrocedida vuelve al delta y al patch cuando el recomputo la re-concede', () => {
    // prev.collectibles quedó sin la variante pero el contador ×2 la sostiene.
    const prev = state({
      unlocked: ['primer-paso'],
      counts: { 'primer-paso': 2 },
      snapshot: ['primer-paso'],
      collectibles: [],
    })
    const result = evaluateAchievementPersistence(prev, ['primer-paso'])
    expect(result.patch.collectibles).toEqual([{ achievementId: 'primer-paso', variantId: 'polished' }])
    expect(result.variantDelta).toEqual([{ achievementId: 'primer-paso', variantId: 'polished' }])
  })

  it('con chapas idénticas al recomputo no hay delta ni patch de chapas', () => {
    const polished = { achievementId: 'primer-paso', variantId: 'polished' }
    const prev = state({
      unlocked: ['primer-paso'],
      counts: { 'primer-paso': 2 },
      snapshot: ['primer-paso'],
      collectibles: [polished],
    })
    const result = evaluateAchievementPersistence(prev, ['primer-paso'])
    expect(result.variantDelta).toEqual([])
    expect(result.patch.collectibles).toBeUndefined()
  })

  it('solo-si-cambió: con snapshot ya igual a earnedIds no hay patch.snapshot', () => {
    const polished = { achievementId: 'primer-paso', variantId: 'polished' }
    const prev = state({
      unlocked: ['primer-paso'],
      counts: { 'primer-paso': 2 },
      snapshot: ['primer-paso'],
      collectibles: [polished],
    })
    const result = evaluateAchievementPersistence(prev, ['primer-paso'])
    expect(result.patch).toEqual({})
    expect('snapshot' in result.patch).toBe(false)
  })
})
