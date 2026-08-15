// Tests de la paleta de colores por fatiga del maniquí 3D (escala de calor + auxiliares).
import { describe, expect, it } from 'vitest'
import type { FatigueLevel } from './types'
import {
  FATIGUE_HEAT_COLORS,
  MUSCLE_BASE_COLOR,
  MUSCLE_HIGHLIGHT_COLOR,
  MUSCLE_NO_DATA_COLOR,
  fatigueToColor,
} from './muscleColors'

describe('fatigueToColor', () => {
  it('mapea cada nivel a su color de la escala de calor', () => {
    expect(fatigueToColor('fresh')).toBe(FATIGUE_HEAT_COLORS.fresh)
    expect(fatigueToColor('warm')).toBe(FATIGUE_HEAT_COLORS.warm)
    expect(fatigueToColor('fatigued')).toBe(FATIGUE_HEAT_COLORS.fatigued)
    expect(fatigueToColor('sore')).toBe(FATIGUE_HEAT_COLORS.sore)
  })

  it('devuelve el gris «sin datos» cuando no hay nivel (distinto de «recuperado»)', () => {
    expect(fatigueToColor(undefined)).toBe(MUSCLE_NO_DATA_COLOR)
    expect(fatigueToColor(undefined)).not.toBe(FATIGUE_HEAT_COLORS.fresh)
  })

  it('cubre todos los niveles de FatigueLevel con hex válidos', () => {
    const levels: FatigueLevel[] = ['fresh', 'warm', 'fatigued', 'sore']
    for (const level of levels) {
      expect(FATIGUE_HEAT_COLORS[level]).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('los colores auxiliares del maniquí son hex válidos', () => {
    expect(MUSCLE_NO_DATA_COLOR).toMatch(/^#[0-9a-f]{6}$/)
    expect(MUSCLE_BASE_COLOR).toMatch(/^#[0-9a-f]{6}$/)
    expect(MUSCLE_HIGHLIGHT_COLOR).toMatch(/^#[0-9a-f]{6}$/)
  })
})
