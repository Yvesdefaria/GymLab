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
    // unlocked y snapshot con valores DISTINTOS: un misroute entre ambas
    // escrituras deja de ser invisible (con listas iguales, cruzar las claves
    // produciría las mismas llamadas).
    const patch: AchievementStatePatch = {
      unlocked: ['a1', 'a2'],
      counts: { a1: 1 },
      snapshot: ['a1'],
      collectibles: [collectible],
    }
    const { calls, repo } = makeRepo()

    persistAchievementPatch(patch, repo)

    expect(calls).toEqual([
      [UNLOCKED_ACHIEVEMENTS_KEY, ['a1', 'a2']],
      [ACHIEVEMENT_COUNTS_KEY, { a1: 1 }],
      [ACHIEVEMENT_SNAPSHOT_KEY, ['a1']],
      [COLLECTIBLES_KEY, [collectible]],
    ])
  })

  // R3-REL-001 (lote-16): cada campo en AISLAMIENTO — un patch parcial escribe
  // exactamente su clave/valor y nada más. El patch completo no caza un gate que
  // escribe la clave equivocada (p. ej. counts condicionado a snapshot): acá sí.
  const partialCases: Array<{
    nombre: string
    patch: AchievementStatePatch
    esperado: Array<[string, unknown]>
  }> = [
    { nombre: 'unlocked', patch: { unlocked: ['a2'] }, esperado: [[UNLOCKED_ACHIEVEMENTS_KEY, ['a2']]] },
    { nombre: 'counts', patch: { counts: { a1: 3 } }, esperado: [[ACHIEVEMENT_COUNTS_KEY, { a1: 3 }]] },
    { nombre: 'snapshot', patch: { snapshot: ['a2', 'a1'] }, esperado: [[ACHIEVEMENT_SNAPSHOT_KEY, ['a2', 'a1']]] },
    {
      nombre: 'collectibles',
      patch: { collectibles: [{ achievementId: 'a2', variantId: 'oro' }] },
      esperado: [[COLLECTIBLES_KEY, [{ achievementId: 'a2', variantId: 'oro' }]]],
    },
  ]

  it.each(partialCases)(
    'un patch parcial con solo $nombre escribe exactamente su clave y nada más (R3-REL-001)',
    ({ patch, esperado }) => {
      const { calls, repo } = makeRepo()
      persistAchievementPatch(patch, repo)
      expect(calls).toEqual(esperado)
    }
  )

  it('un patch vacío no escribe nada (idempotencia solo-si-cambió)', () => {
    const { calls, repo } = makeRepo()

    persistAchievementPatch({}, repo)

    expect(calls).toEqual([])
  })
})
