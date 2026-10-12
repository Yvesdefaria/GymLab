// R3-002 (lote-13.followups): el pairing campo ↔ clave de las 4 escrituras
// solo-si-cambió de `persistAchievementPatch` se cubre por CONDUCTA con un repo
// falso — cruzar dos claves (p. ej. unlocked ↔ counts) persistiría el dato
// equivocado en meta y este test debe cazarlo (el audit de texto no ve el cruce).
// R3-REL-003 (lote-18): además, un fallo de meta (rechazo async o throw sync) no
// debe escapar como unhandled rejection ni abortar las escrituras siguientes.
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

// Patch completo y pares esperados de los tests de rechazo (R3-REL-003).
const fullPatch: AchievementStatePatch = {
  unlocked: ['a1', 'a2'],
  counts: { a1: 1 },
  snapshot: ['a1'],
  collectibles: [{ achievementId: 'a1', variantId: 'bronce' }],
}
const fullWrites: Array<[string, unknown]> = [
  [UNLOCKED_ACHIEVEMENTS_KEY, fullPatch.unlocked],
  [ACHIEVEMENT_COUNTS_KEY, fullPatch.counts],
  [ACHIEVEMENT_SNAPSHOT_KEY, fullPatch.snapshot],
  [COLLECTIBLES_KEY, fullPatch.collectibles],
]

// Patrón del lote 1 (useHealthSync R3-003): setTimeout REAL capturado antes de
// cualquier fake timer — Node emite `unhandledRejection` recién en un turno real
// de event loop, y así la captura es determinista.
const realSetTimeout = globalThis.setTimeout.bind(globalThis)

const flushMicrotasks = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve()
}

// Captura el rechazo sin manejar del turno actual y devuelve el desenganche.
const captureUnhandledRejections = () => {
  const unhandled: unknown[] = []
  const onUnhandled = (reason: unknown) => unhandled.push(reason)
  process.on('unhandledRejection', onUnhandled)
  return {
    unhandled,
    stop: () => process.off('unhandledRejection', onUnhandled),
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

  // R3-REL-003 (lote-18): las escrituras del patch son fire-and-forget; un
  // rechazo de meta no debe escapar como unhandled rejection.
  it('un setJson que rechaza no escapa como unhandled rejection y las 4 escrituras se intentan (R3-REL-003)', async () => {
    const { unhandled, stop } = captureUnhandledRejections()
    try {
      const calls: Array<[string, unknown]> = []
      const repo = {
        setJson: (key: string, value: unknown): Promise<unknown> => {
          calls.push([key, value])
          return Promise.reject(new Error(`meta caída: ${key}`))
        },
      }

      persistAchievementPatch(fullPatch, repo)
      // Turno REAL de event loop: recién aquí Node emitiría el rechazo sin manejar.
      await new Promise((resolve) => realSetTimeout(resolve, 0))
      await flushMicrotasks()

      expect(calls).toEqual(fullWrites)
      expect(unhandled).toEqual([])
    } finally {
      stop()
    }
  })

  it('el rechazo de una escritura no aborta las siguientes: las 4 se intentan (R3-REL-003)', async () => {
    const { unhandled, stop } = captureUnhandledRejections()
    try {
      const calls: Array<[string, unknown]> = []
      const repo = {
        setJson: (key: string, value: unknown): Promise<unknown> => {
          calls.push([key, value])
          // Solo la primera falla: un rechazo async no debe cortar la secuencia.
          return calls.length === 1 ? Promise.reject(new Error('meta caída')) : Promise.resolve()
        },
      }

      persistAchievementPatch(fullPatch, repo)
      await new Promise((resolve) => realSetTimeout(resolve, 0))
      await flushMicrotasks()

      expect(calls).toEqual(fullWrites)
      expect(unhandled).toEqual([])
    } finally {
      stop()
    }
  })

  it('un setJson que lanza síncronamente no rompe al caller ni aborta las siguientes (R3-REL-003)', () => {
    const calls: Array<[string, unknown]> = []
    const repo = {
      setJson: (key: string, value: unknown): Promise<unknown> => {
        calls.push([key, value])
        // La primera escritura lanza sin devolver promesa (fallo de meta síncrono).
        if (calls.length === 1) throw new Error('meta caída síncrona')
        return Promise.resolve()
      },
    }

    expect(() => persistAchievementPatch(fullPatch, repo)).not.toThrow()
    expect(calls).toEqual(fullWrites)
  })
})
