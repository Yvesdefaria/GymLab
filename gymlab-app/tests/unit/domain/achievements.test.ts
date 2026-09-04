// Tests del dominio de logros: tiers por rareza y contador transicional
// (veces conseguido) para las chapas-medalla estilo BO2.
import { describe, expect, it } from 'vitest'
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_TIERS,
  type AchievementTier,
  nextAchievementCounts,
} from '@/domain/achievements'

const VALID_TIERS: AchievementTier[] = ['bronze', 'silver', 'gold', 'platinum']

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