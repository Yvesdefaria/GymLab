// Tests del dominio de variantes de chapa (F95.1): la concesión es una función
// pura de los contadores «veces conseguido» — cada re-logro concede la siguiente
// variante de una secuencia fija por logro (índice = count − 2, capada a la
// secuencia). Sin monedas ni tiradas aleatorias: mismos counts ⇒ mismo conjunto.
import { describe, expect, it } from 'vitest'
import {
  ACHIEVEMENT_VARIANTS,
  grantedCollectibles,
  latestCollectible,
  latestVariants,
  mergeCollectibles,
  type Collectible,
} from '@/domain/achievements'

describe('ACHIEVEMENT_VARIANTS', () => {
  it('todos los logros re-logrables tienen secuencia fija de ≤ 3 variantes sin repetir', () => {
    const reEarnable = Object.entries(ACHIEVEMENT_VARIANTS).filter(([, seq]) => seq.length > 0)
    expect(reEarnable.length).toBeGreaterThan(0)
    for (const [id, seq] of reEarnable) {
      expect(seq.length).toBeLessThanOrEqual(3)
      expect(new Set(seq).size).toBe(seq.length)
      expect(id.length).toBeGreaterThan(0)
    }
  })

  it('los logros permanentes (guias-completas, primer-ano) solo tienen base: secuencia vacía', () => {
    expect(ACHIEVEMENT_VARIANTS['guias-completas']).toEqual([])
    expect(ACHIEVEMENT_VARIANTS['primer-ano']).toEqual([])
  })
})

describe('grantedCollectibles', () => {
  it('counts vacíos → sin concesiones', () => {
    expect(grantedCollectibles({})).toEqual([])
  })

  it('count 1 → sin concesión (la chapa base cubre el primer logro)', () => {
    expect(grantedCollectibles({ 'primer-paso': 1 })).toEqual([])
  })

  it('count 2 → concede la variante índice 0 de la secuencia (polished)', () => {
    expect(grantedCollectibles({ 'primer-paso': 2 })).toEqual([
      { achievementId: 'primer-paso', variantId: 'polished' },
    ])
  })

  it('count 3 → concede las variantes 0 y 1 (la segunda, radiant, es la nueva)', () => {
    expect(grantedCollectibles({ 'primer-paso': 3 })).toEqual([
      { achievementId: 'primer-paso', variantId: 'polished' },
      { achievementId: 'primer-paso', variantId: 'radiant' },
    ])
  })

  it('secuencia agotada: count 9 → solo las 3 variantes fijas y sin error', () => {
    expect(grantedCollectibles({ 'primer-paso': 9 })).toEqual([
      { achievementId: 'primer-paso', variantId: 'polished' },
      { achievementId: 'primer-paso', variantId: 'radiant' },
      { achievementId: 'primer-paso', variantId: 'onyx' },
    ])
  })

  it('secuencia vacía: count alto en un logro permanente no concede nada', () => {
    expect(grantedCollectibles({ 'guias-completas': 9 })).toEqual([])
  })

  it('id desconocido: se ignora sin romper', () => {
    expect(grantedCollectibles({ 'no-existe': 5 })).toEqual([])
  })

  it('idempotencia: mismos counts → mismo conjunto (función pura)', () => {
    const counts = { 'primer-paso': 3, inaugural: 2, 'sesiones-500': 4 }
    expect(grantedCollectibles(counts)).toEqual(grantedCollectibles({ ...counts }))
  })
})

describe('mergeCollectibles', () => {
  it('une sin duplicar pares ya presentes (idempotente ante re-evaluación)', () => {
    const prev: Collectible[] = [{ achievementId: 'primer-paso', variantId: 'polished' }]
    const next = grantedCollectibles({ 'primer-paso': 2 })
    expect(mergeCollectibles(prev, next)).toEqual(prev)
  })

  it('apendiza las concesiones nuevas conservando el orden', () => {
    const prev: Collectible[] = [{ achievementId: 'primer-paso', variantId: 'polished' }]
    const next = grantedCollectibles({ 'primer-paso': 3 })
    expect(mergeCollectibles(prev, next)).toEqual([
      { achievementId: 'primer-paso', variantId: 'polished' },
      { achievementId: 'primer-paso', variantId: 'radiant' },
    ])
  })
})

describe('latestCollectible', () => {
  it('devuelve la última variante concedida del logro (la vigente)', () => {
    // count 3 ⇒ índices 0 y 1: la vigente es radiant (onyx exige count 4)
    const all = grantedCollectibles({ 'primer-paso': 3 })
    expect(latestCollectible(all, 'primer-paso')?.variantId).toBe('radiant')
    const full = grantedCollectibles({ 'primer-paso': 4 })
    expect(latestCollectible(full, 'primer-paso')?.variantId).toBe('onyx')
  })

  it('undefined cuando el logro no tiene variantes concedidas', () => {
    expect(latestCollectible([], 'primer-paso')).toBeUndefined()
    expect(latestCollectible(grantedCollectibles({ inaugural: 2 }), 'primer-paso')).toBeUndefined()
  })
})

describe('latestVariants', () => {
  it('mapea la última variante concedida de cada logro', () => {
    const collectibles = [
      { achievementId: 'primer-paso', variantId: 'polished' },
      { achievementId: 'inaugural', variantId: 'polished' },
      { achievementId: 'primer-paso', variantId: 'radiant' },
    ]
    expect(latestVariants(collectibles)).toEqual({
      'primer-paso': 'radiant',
      inaugural: 'polished',
    })
  })

  it('devuelve un mapa vacío sin variantes', () => {
    expect(latestVariants([])).toEqual({})
  })
})