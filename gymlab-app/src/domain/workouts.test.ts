import { describe, expect, it } from 'vitest'
import { workoutDate, workoutDurationMin, weeklyVolume } from './workouts'

describe('workoutDurationMin', () => {
  it('devuelve null sin finishedAt', () => {
    expect(workoutDurationMin({ startedAt: '2024-01-01T10:00:00', finishedAt: null })).toBeNull()
  })

  it('calcula minutos redondeados', () => {
    expect(
      workoutDurationMin({
        startedAt: '2024-01-01T10:00:00',
        finishedAt: '2024-01-01T10:30:00',
      })
    ).toBe(30)
  })

  it('redondea y aplica mínimo 1 min', () => {
    expect(
      workoutDurationMin({
        startedAt: '2024-01-01T10:00:00',
        finishedAt: '2024-01-01T10:00:30',
      })
    ).toBe(1)
    expect(
      workoutDurationMin({
        startedAt: '2024-01-01T10:00:00',
        finishedAt: '2024-01-01T10:01:30',
      })
    ).toBe(2)
  })
})

describe('workoutDate', () => {
  it('prioriza localDate como mediodia local', () => {
    const d = workoutDate({ localDate: '2024-05-01', startedAt: '2024-05-01T08:00:00' })
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(4)
    expect(d.getDate()).toBe(1)
    expect(d.getHours()).toBe(12)
  })

  it('cae a startedAt sin localDate', () => {
    const d = workoutDate({ localDate: undefined, startedAt: '2024-05-02T18:30:00' })
    expect(d.getTime()).toBe(new Date('2024-05-02T18:30:00').getTime())
  })
})

describe('weeklyVolume', () => {
  const now = new Date('2024-06-10T12:00:00')

  it('suma volumen de la ultima semana usando localDate', () => {
    const workouts = [
      { localDate: '2024-06-08', startedAt: '2024-06-08T09:00:00', totalVolume: 1000 },
      { localDate: '2024-06-03', startedAt: '2024-06-03T09:00:00', totalVolume: 2000 },
      { localDate: '2024-05-30', startedAt: '2024-05-30T09:00:00', totalVolume: 4000 },
    ]
    expect(weeklyVolume(workouts, now)).toBe(3000)
  })

  it('incluye workouts sin localDate via startedAt', () => {
    const workouts = [
      { localDate: undefined, startedAt: '2024-06-09T09:00:00', totalVolume: 500 },
    ]
    expect(weeklyVolume(workouts, now)).toBe(500)
  })

  it('devuelve 0 sin workouts', () => {
    expect(weeklyVolume([], now)).toBe(0)
  })
})
