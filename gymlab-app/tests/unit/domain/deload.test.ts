// Tests del dominio de la semana de deload: fecha de fin, vigencia y señal automática.
import { describe, expect, it, vi } from 'vitest'
import { DELOAD_WEEK_DAYS, deloadUntilDate, isDeloadActive } from '@/domain/deload'
import { detectDeloadSignal } from '@/domain/progress'
import type { Workout } from '@/domain/types'

describe('deloadUntilDate', () => {
  it('devuelve hoy + 7 días en formato local YYYY-MM-DD', () => {
    const base = new Date(2026, 7, 24, 12, 0, 0) // 2026-08-24 (lunes)
    vi.useFakeTimers()
    vi.setSystemTime(base)
    expect(deloadUntilDate()).toBe('2026-08-31')
    vi.useRealTimers()
  })
})

describe('isDeloadActive', () => {
  it('inactiva sin marca activa', () => {
    expect(isDeloadActive(false, '2026-09-01')).toBe(false)
    expect(isDeloadActive(undefined, undefined)).toBe(false)
  })

  it('activa sin fecha límite (indefinida)', () => {
    expect(isDeloadActive(true, null)).toBe(true)
    expect(isDeloadActive(true, undefined)).toBe(true)
  })

  it('activa mientras la fecha límite no haya pasado (incluye el día completo)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 28, 10, 0, 0)) // dentro de la semana
    expect(isDeloadActive(true, '2026-08-31')).toBe(true)
    vi.useRealTimers()
  })

  it('inactiva cuando la fecha límite ya pasó', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 2, 10, 0, 0)) // 2026-09-02
    expect(isDeloadActive(true, '2026-08-31')).toBe(false)
    vi.useRealTimers()
  })
})

describe('detectDeloadSignal', () => {
  const workout = (startedAt: string, totalVolume: number): Workout =>
    ({
      id: Math.floor(Math.random() * 1e6),
      startedAt,
      finishedAt: startedAt,
      localDate: startedAt.slice(0, 10),
      routineId: null,
      routineDayId: null,
      totalVolume,
    }) as Workout

  it('devuelve null con menos de 2 workouts en cada ventana', () => {
    const now = new Date()
    const iso = (offsetDays: number) => {
      const d = new Date(now.getTime() + offsetDays * 86_400_000)
      return d.toISOString()
    }
    const workouts = [workout(iso(-1), 5000), workout(iso(-2), 5000)]
    expect(detectDeloadSignal(workouts)).toBeNull()
  })

  it('sugiere deload cuando el volumen medio de las últimas 3 semanas cae >=15%', () => {
    const now = new Date()
    const iso = (offsetDays: number) => {
      const d = new Date(now.getTime() + offsetDays * 86_400_000)
      return d.toISOString()
    }
    // Semanas anteriores (días -35, -28, -21): volumen alto (10000/semana).
    // Semanas recientes (días -14, -7, -1): volumen bajo (4000/semana) -> caída ~60%.
    const workouts = [
      workout(iso(-35), 30000),
      workout(iso(-28), 30000),
      workout(iso(-21), 30000),
      workout(iso(-14), 12000),
      workout(iso(-7), 12000),
      workout(iso(-1), 12000),
    ]
    const signal = detectDeloadSignal(workouts)
    expect(signal).not.toBeNull()
    expect(signal!.suggestsDeload).toBe(true)
    expect(signal!.dropPct).toBeGreaterThanOrEqual(15)
  })

  it('no sugiere deload si el volumen se mantiene', () => {
    const now = new Date()
    const iso = (offsetDays: number) => {
      const d = new Date(now.getTime() + offsetDays * 86_400_000)
      return d.toISOString()
    }
    const workouts = [
      workout(iso(-35), 10000),
      workout(iso(-28), 10000),
      workout(iso(-21), 10000),
      workout(iso(-14), 10000),
      workout(iso(-7), 10000),
      workout(iso(-1), 10000),
    ]
    const signal = detectDeloadSignal(workouts)
    expect(signal).not.toBeNull()
    expect(signal!.suggestsDeload).toBe(false)
  })

  it('devuelve null sin volumen previo', () => {
    const now = new Date()
    const iso = (offsetDays: number) => {
      const d = new Date(now.getTime() + offsetDays * 86_400_000)
      return d.toISOString()
    }
    const workouts = [workout(iso(-1), 5000), workout(iso(-2), 0), workout(iso(-3), 0)]
    expect(detectDeloadSignal(workouts)).toBeNull()
  })
})