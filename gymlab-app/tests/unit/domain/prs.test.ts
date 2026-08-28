// Tests de helpers de PRs: normalización de fecha y conteos semanales.
import { describe, expect, it } from 'vitest'
import { prDateKey, countPrsInWeek } from '@/domain/prs'
import { addLocalDays, toLocalDateStr } from '@/domain/dates'
import type { PRRecord } from '@/domain/types'

const makePr = (date: string, exerciseId = 1): PRRecord => ({
  exerciseId,
  weightKg: 100,
  reps: 2,
  date,
  estimated1RM: 105,
})

describe('prDateKey', () => {
  it('deja intacta una fecha de solo día', () => {
    expect(prDateKey('2026-08-28')).toBe('2026-08-28')
  })

  it('normaliza un ISO con hora a día local YYYY-MM-DD', () => {
    const iso = '2026-08-28T21:30:00.000Z'
    expect(prDateKey(iso)).toBe(toLocalDateStr(new Date(iso)))
  })
})

describe('countPrsInWeek', () => {
  it('cuenta los PRs de la semana de `now` y descarta los de semanas previas', () => {
    const now = new Date('2026-08-28T12:00:00')
    const todayKey = toLocalDateStr(now)
    const prs = [
      makePr(todayKey),
      makePr(addLocalDays(todayKey, -1)),
      makePr(addLocalDays(todayKey, -10)),
    ]
    expect(countPrsInWeek(prs, now)).toBe(2)
  })

  it('devuelve 0 sin PRs', () => {
    expect(countPrsInWeek([], new Date('2026-08-28T12:00:00'))).toBe(0)
  })
})