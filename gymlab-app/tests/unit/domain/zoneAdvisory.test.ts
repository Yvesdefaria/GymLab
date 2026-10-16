// F122: aviso de zona (músculo) — agrega la velocidad del peso de trabajo por zona y
// devuelve solo las que vienen subiendo por encima del umbral del freno (informativo).
import { describe, expect, it } from 'vitest'
import { buildZoneAdvisories } from '@/domain/zoneAdvisory'
import type { WorkingSetLike } from '@/domain/workingProgression'

const NOW = new Date('2026-10-16T12:00:00.000Z')
const daysAgo = (days: number): string =>
  new Date(NOW.getTime() - days * 86_400_000).toISOString()

const session = (workoutId: number, weightKg: number, days: number): WorkingSetLike[] =>
  Array.from({ length: 3 }, () => ({
    workoutId,
    weightKg,
    reps: 8,
    completed: true,
    createdAt: daysAgo(days),
  }))

describe('buildZoneAdvisories', () => {
  it('sin señal no hay avisos', () => {
    expect(buildZoneAdvisories({ setsByExercise: new Map(), muscleByExerciseId: new Map() })).toEqual(
      []
    )
  })

  it('toma la velocidad máxima por zona y filtra por umbral estricto', () => {
    const setsByExercise = new Map<number, WorkingSetLike[]>([
      [1, [...session(1, 80, 14), ...session(2, 85, 0)]], // pecho: 3,125 %/semana
      [2, [...session(1, 80, 28), ...session(2, 84, 0)]], // pecho: 1,25 %/semana
      [3, [...session(1, 100, 28), ...session(2, 101, 0)]], // piernas: por debajo
    ])
    const muscleByExerciseId = new Map<number, string>([
      [1, 'pecho'],
      [2, 'pecho'],
      [3, 'piernas'],
    ])
    expect(buildZoneAdvisories({ setsByExercise, muscleByExerciseId, now: NOW })).toEqual([
      { zone: 'pecho', pctPerWeek: 3.125 },
    ])
  })

  it('el umbral es estricto: exactamente 2,5 %/semana no aparece', () => {
    const setsByExercise = new Map<number, WorkingSetLike[]>([
      [1, [...session(1, 80, 14), ...session(2, 84, 0)]], // 2,5 %/semana exacto
    ])
    const muscleByExerciseId = new Map<number, string>([[1, 'espalda']])
    expect(buildZoneAdvisories({ setsByExercise, muscleByExerciseId, now: NOW })).toEqual([])
  })

  it('ignora ejercicios sin zona conocida y ordena por velocidad', () => {
    const setsByExercise = new Map<number, WorkingSetLike[]>([
      [1, [...session(1, 80, 14), ...session(2, 85, 0)]], // 3,125 → hombro
      [2, [...session(1, 60, 14), ...session(2, 66, 0)]], // 5,0 → espalda
      [3, [...session(1, 90, 14), ...session(2, 96, 0)]], // sin mapeo → ignorado
    ])
    const muscleByExerciseId = new Map<number, string>([
      [1, 'hombro'],
      [2, 'espalda'],
    ])
    expect(buildZoneAdvisories({ setsByExercise, muscleByExerciseId, now: NOW })).toEqual([
      { zone: 'espalda', pctPerWeek: 5 },
      { zone: 'hombro', pctPerWeek: 3.125 },
    ])
  })
})
