/**
 * F139.3 — Las fechas del dominio deben usar la fecha local, no `toISOString`.
 * El bug solo se reproduce en una zona distinta de UTC cerca de medianoche:
 * acá fijamos -03 para que el borde exista de verdad (si no, el test sería vacuo).
 */
import { afterAll, describe, expect, it, vi } from 'vitest'
import { deloadDayProgress } from '@/domain/deload'
import { isCheckedToday } from '@/domain/supplements'
import type { SupplementEntry } from '@/domain/types'

const ORIGINAL_TZ = process.env.TZ
process.env.TZ = 'America/Argentina/Buenos_Aires'
afterAll(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ
  else process.env.TZ = ORIGINAL_TZ
})

const makeSup = (overrides: Partial<SupplementEntry> = {}): SupplementEntry => ({
  id: 1,
  name: 'Creatina',
  dose: '5g',
  frequency: 'diario',
  active: true,
  createdAt: '2026-01-01T00:00:00',
  ...overrides,
})

describe('fecha local cerca de medianoche', () => {
  it('la zona de prueba es -03 (si no, el borde no se reproduce)', () => {
    expect(new Date(2026, 0, 15, 23, 30).getTimezoneOffset()).toBe(180)
  })

  it('deloadDayProgress usa la fecha local, no la UTC', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15, 23, 30)) // local 2026-01-15 23:30
    // until 2026-01-18 → quedan 3 días → día 5. Con toISOString el "hoy"
    // sería 2026-01-16 y daría día 6.
    expect(deloadDayProgress('2026-01-18')).toBe(5)
    vi.useRealTimers()
  })

  it('isCheckedToday usa la fecha local, no la UTC', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15, 23, 30)) // local 2026-01-15 23:30
    const s = makeSup({ lastCheckedAt: '2026-01-15T20:00:00' })
    expect(isCheckedToday(s)).toBe(true)
    vi.useRealTimers()
  })

  it('entiende el timestamp UTC que persiste la UI', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15, 22, 0)) // local 22:00 → UTC 2026-01-16T01:00
    const stored = new Date().toISOString()
    expect(stored.slice(0, 10)).toBe('2026-01-16') // el prefijo UTC ya es "mañana"
    expect(isCheckedToday(makeSup({ lastCheckedAt: stored }))).toBe(true)
    vi.useRealTimers()
  })
})
