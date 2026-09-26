import { describe, expect, it } from 'vitest'
import { seedRoutines } from '@/data/seed/routines/routines'
import { seedRoutineDays } from '@/data/seed/routines/days'
import { seedRoutineItems } from '@/data/seed/routines/items'
import { seedExercises } from '@/data/seed/exercises'

// Exenciones aprobadas (spec § Anexo B): programas de fuerza con repetición declarada,
// full-body/circuito, objetivo específico y artefactos de cardio. NO se tocan.
const EXEMPT_ROUTINE_IDS = new Set([
  4, 5, 7, 11, 12, 14, 16, 17, 29, 30, 31, 33, 34, 35, 36, 37, 38, 39, 47, 49, 51, 52, 53, 54, 56, 57, 58, 59, 66, 68, 69, 70,
])

// Rutinas curadas en esta fase (Anexo A): además de 0 colisiones, sin copias exactas por día.
const CURATED_ROUTINE_IDS = new Set([26, 28, 40, 41, 42, 43, 44, 45, 46, 48, 55, 62, 63, 64, 65, 67])

const muscleById = new Map(seedExercises.map((e) => [e.id, e.muscleGroup]))

const dayMuscles = (routineId: number): Map<number, Set<string>> => {
  const byDay = new Map<number, Set<string>>()
  const dayIds = seedRoutineDays.filter((d) => d.routineId === routineId)
  for (const day of dayIds) {
    const groups = new Set<string>()
    for (const item of seedRoutineItems.filter((i) => i.routineDayId === day.id)) {
      const group = muscleById.get(item.exerciseId)
      if (group) groups.add(group)
    }
    byDay.set(day.dayIndex, groups)
  }
  return byDay
}

describe('coherencia del seed (F66/F67 pulido)', () => {
  it('ninguna rutina no exenta repite grupo muscular en días consecutivos', () => {
    const violations: string[] = []
    for (const routine of seedRoutines) {
      if (EXEMPT_ROUTINE_IDS.has(routine.id)) continue
      const byDay = dayMuscles(routine.id)
      const indexes = [...byDay.keys()].sort((a, b) => a - b)
      for (let i = 0; i + 1 < indexes.length; i += 1) {
        const a = byDay.get(indexes[i])!
        const b = byDay.get(indexes[i + 1])!
        const overlap = [...a].filter((g) => b.has(g))
        if (overlap.length > 0) violations.push(`r${routine.id} (${routine.slug}): ${overlap.join(', ')} en días ${indexes[i]}→${indexes[i + 1]}`)
      }
    }
    expect(violations).toEqual([])
  })

  it('las rutinas curadas no tienen copias exactas dentro de un mismo día', () => {
    const duplicates: string[] = []
    for (const routine of seedRoutines) {
      if (!CURATED_ROUTINE_IDS.has(routine.id)) continue
      for (const day of seedRoutineDays.filter((d) => d.routineId === routine.id)) {
        const seen = new Set<string>()
        for (const item of seedRoutineItems.filter((i) => i.routineDayId === day.id)) {
          const key = [item.exerciseId, item.targetSets, item.targetReps, item.restSec, item.supersetGroup ?? ''].join('|')
          if (seen.has(key)) duplicates.push(`r${routine.id} día ${day.id}: ejercicio ${item.exerciseId} duplicado`)
          seen.add(key)
        }
      }
    }
    expect(duplicates).toEqual([])
  })
})
