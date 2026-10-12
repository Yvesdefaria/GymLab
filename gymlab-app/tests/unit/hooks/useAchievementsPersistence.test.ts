// R3-002 (lote-13.followups): el pairing campo ↔ clave de las 4 escrituras
// solo-si-cambió de `persistAchievementPatch` se cubre por CONDUCTA con un repo
// falso — cruzar dos claves (p. ej. unlocked ↔ counts) persistiría el dato
// equivocado en meta y este test debe cazarlo (el audit de texto no ve el cruce).
import { describe, expect, it } from 'vitest'
import {
  ACHIEVEMENT_COUNTS_KEY,
  ACHIEVEMENT_SNAPSHOT_KEY,
  COLLECTIBLES_KEY,
  UNLOCKED_ACHIEVEMENTS_KEY,
  persistAchievementPatch,
} from '@/hooks/useAchievements'
import type { AchievementStatePatch } from '@/domain/achievementReconcile'
import type { Collectible } from '@/domain/achievements'

const makeRepo = () => {
  const calls: Array<[string, unknown]> = []
  return {
    calls,
    repo: {
      setJson: (key: string, value: unknown): Promise<unknown> => {
        calls.push([key, value])
        return Promise.resolve()
      },
    },
  }
}

describe('persistAchievementPatch', () => {
  it('empareja cada campo del patch con su clave meta, en orden', () => {
    const collectible: Collectible = { achievementId: 'a1', variantId: 'bronce' }
    const patch: AchievementStatePatch = {
      unlocked: ['a1'],
      counts: { a1: 1 },
      snapshot: ['a1'],
      collectibles: [collectible],
    }
    const { calls, repo } = makeRepo()

    persistAchievementPatch(patch, repo)

    expect(calls).toEqual([
      [UNLOCKED_ACHIEVEMENTS_KEY, ['a1']],
      [ACHIEVEMENT_COUNTS_KEY, { a1: 1 }],
      [ACHIEVEMENT_SNAPSHOT_KEY, ['a1']],
      [COLLECTIBLES_KEY, [collectible]],
    ])
  })

  it('un patch vacío no escribe nada (idempotencia solo-si-cambió)', () => {
    const { calls, repo } = makeRepo()

    persistAchievementPatch({}, repo)

    expect(calls).toEqual([])
  })
})
