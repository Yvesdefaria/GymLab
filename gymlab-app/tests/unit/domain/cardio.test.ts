// Tests del heurístico de MET por slug: mismo comportamiento que el resolveMet
// privado de ExerciseBlock, ahora compartido en dominio.
import { describe, expect, it } from 'vitest'
import { isGpsModeAvailable, metForSlug, metValues } from '@/domain/cardio'

describe('isGpsModeAvailable', () => {
  it('solo ofrece GPS en web', () => {
    expect(isGpsModeAvailable('web', true)).toBe(true)
    expect(isGpsModeAvailable('web', false)).toBe(false)
    expect(isGpsModeAvailable('android', true)).toBe(false)
    expect(isGpsModeAvailable('ios', true)).toBe(false)
  })
})

describe('metForSlug', () => {
  it('resuelve los slugs de cardio por subcadena (inglés y español)', () => {
    expect(metForSlug('running-intervals')).toBe(metValues.running)
    expect(metForSlug('salir-a-correr')).toBe(metValues.running)
    expect(metForSlug('walking-incline')).toBe(metValues.walking)
    expect(metForSlug('caminata-suave')).toBe(metValues.walking)
    expect(metForSlug('bicycling-estatica')).toBe(metValues.cycling)
    expect(metForSlug('bici-fija')).toBe(metValues.cycling)
    expect(metForSlug('boxing-rounds')).toBe(metValues.boxing)
    expect(metForSlug('boxeo-tecnica')).toBe(metValues.boxing)
  })

  it('ignora mayúsculas', () => {
    expect(metForSlug('RUNNING')).toBe(metValues.running)
  })

  it('cae al MET genérico con un slug desconocido o vacío', () => {
    expect(metForSlug('press-banca')).toBe(metValues.generic)
    expect(metForSlug('')).toBe(metValues.generic)
  })
})
