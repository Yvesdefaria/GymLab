// Definiciones únicas de serie: la base de PR, volumen, e1RM, fatiga y comparador.
import { describe, expect, it } from 'vitest'
import { isCardioSet, isCompletedSet, isWorkingSet } from '@/domain/setFilters'

const set = (over: Partial<Parameters<typeof isWorkingSet>[0]> = {}) => ({
  completed: true,
  weightKg: 100,
  reps: 5,
  ...over,
})

describe('isWorkingSet', () => {
  it('acepta una serie completada, sin calentamiento y con peso y reps', () => {
    expect(isWorkingSet(set())).toBe(true)
  })

  it('rechaza calentamientos, incompletas, peso 0 y reps 0', () => {
    expect(isWorkingSet(set({ isWarmup: true }))).toBe(false)
    expect(isWorkingSet(set({ completed: false }))).toBe(false)
    expect(isWorkingSet(set({ weightKg: 0 }))).toBe(false)
    expect(isWorkingSet(set({ reps: 0 }))).toBe(false)
  })
})

describe('isCompletedSet', () => {
  it('incluye calentamientos completados', () => {
    expect(isCompletedSet(set({ isWarmup: true }))).toBe(true)
    expect(isCompletedSet(set({ completed: false }))).toBe(false)
  })
})

describe('isCardioSet', () => {
  it('detecta una serie por duración', () => {
    expect(isCardioSet(set({ durationSeconds: 60 }))).toBe(true)
    expect(isCardioSet(set())).toBe(false)
  })
})
