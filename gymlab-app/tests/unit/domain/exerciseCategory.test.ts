/**
 * F139.18 — Los remos son fuerza, no cardio.
 * `CARDIO_RE` incluía `\brow\b`, así que todo remo en singular (nombre o slug)
 * quedaba como `cardio` y `volumeModel.forEachVolumeSet` lo descartaba: las series
 * de espalda, hombro y trapecio no contaban para volumen. Solo la máquina de remo
 * (`rowing`) es cardio.
 */
import { describe, expect, it } from 'vitest'
import { seedExercisesExtra } from '@/data/seed/exercisesExtra'
import { detectCategory, withCategory } from '@/domain/exerciseCategory'
import { countVolumeSets, type VolumeSetSample, type VolumeWorkoutSample } from '@/domain/volumeModel'
import type { Exercise } from '@/domain/types'

const ROW_STRENGTH_SLUGS = [
  'bent-over-two-dumbbell-row',
  'barbell-rear-delt-row',
  'smith-machine-upright-row',
  'upright-cable-row',
  'inverted-row',
  't-bar-row-with-handle',
] as const

const categoryOf = (slug: string): string | undefined => {
  const row = seedExercisesExtra.find((ex) => ex.slug === slug)
  return row ? withCategory(row).category : undefined
}

describe('detectCategory — remos', () => {
  it.each(ROW_STRENGTH_SLUGS)('%s se detecta como fuerza', (slug) => {
    expect(detectCategory('Remo', slug)).toBe('strength')
  })

  it('la máquina de remo (rowing) sigue siendo cardio', () => {
    expect(detectCategory('Remo, estacionario', 'rowing-stationary')).toBe('cardio')
  })
})

describe('catálogo — categoría inferida de los remos', () => {
  it.each(ROW_STRENGTH_SLUGS)('%s es strength en el catálogo', (slug) => {
    expect(categoryOf(slug)).toBe('strength')
  })

  it('rowing-stationary es cardio en el catálogo', () => {
    expect(categoryOf('rowing-stationary')).toBe('cardio')
  })
})

describe('countVolumeSets — una serie de remo cuenta para espalda', () => {
  const row = withCategory(
    seedExercisesExtra.find((ex) => ex.slug === 'bent-over-two-dumbbell-row') as Exercise,
  )
  const workouts = new Map<number, VolumeWorkoutSample>([[1, { localDate: '2026-11-04' }]])
  const exercises = new Map([[row.id, row]])
  const sets: VolumeSetSample[] = [{ workoutId: 1, exerciseId: row.id, completed: true, reps: 8 }]

  it('entra en el total y en el volumen directo de espalda', () => {
    const counts = countVolumeSets(sets, workouts, exercises, '2026-10-08', '2026-11-04')
    expect(counts.total).toBe(1)
    expect(counts.direct.espalda).toBe(1)
  })
})
