import { describe, expect, it } from 'vitest'
import { findPredefinedRoutine, generateRoutinePlan, planRoutine, requiredEquipmentOf } from '@/domain/routineResolution'
import type { Equipment, Exercise, Level, Objective, Routine, RoutineDay, RoutineItem } from '@/domain/types'
import { seedRoutines, seedRoutineDays, seedRoutineItems } from '@/data/seed/routines'
import { seedExercises } from '@/data/seed/exercises'
import { seedExercisesExtra } from '@/data/seed/exercisesExtra'

const ex = (id: number, equipment: Exercise['equipment']): Exercise =>
  ({ id, slug: `ex-${id}`, name: `E${id}`, muscleGroup: 'pecho', equipment, instructions: '' })

// El generador filtra por grupo muscular, asi que los tests necesitan ejercicios de pierna,
// espalda, etc. y no solo de pecho como el helper `ex`.
const exG = (id: number, muscleGroup: Exercise['muscleGroup'], equipment: Exercise['equipment']): Exercise =>
  ({ id, slug: `ex-${id}`, name: `E${id}`, muscleGroup, equipment, instructions: '' })

const routine = (id: number, objective: Routine['objective'], level: Routine['level'], daysCount: number): Routine =>
  ({ id, slug: `r-${id}`, title: `R${id}`, objective, level, description: '', daysCount })

const day = (id: number, routineId: number): RoutineDay =>
  ({ id, routineId, dayIndex: 0, name: 'Día 1' })

const item = (id: number, routineDayId: number, exerciseId: number): RoutineItem =>
  ({ id, routineDayId, exerciseId, targetSets: 3, targetReps: 10, restSec: 90, order: 1 })

describe('requiredEquipmentOf', () => {
  it('une el equipamiento de todos los ejercicios de la rutina', () => {
    const days = [day(100, 1)]
    const items = [item(1, 100, 10), item(2, 100, 11)]
    const byId = new Map([[10, ex(10, ['barra', 'banco'])], [11, ex(11, ['mancuernas'])]])
    expect(requiredEquipmentOf(1, days, items, byId).sort()).toEqual(['banco', 'barra', 'mancuernas'])
  })

  it('ignora los días de OTRAS rutinas', () => {
    const days = [day(100, 1), day(200, 2)]
    const items = [item(1, 100, 10), item(2, 200, 11)]
    const byId = new Map([[10, ex(10, ['barra'])], [11, ex(11, ['kettlebell'])]])
    expect(requiredEquipmentOf(1, days, items, byId)).toEqual(['barra'])
  })

  it('una rutina sin items no exige nada', () => {
    expect(requiredEquipmentOf(1, [day(100, 1)], [], new Map())).toEqual([])
  })
})

describe('findPredefinedRoutine', () => {
  const routines = [routine(1, 'volumen', 'intermedio', 4), routine(2, 'volumen', 'avanzado', 4)]
  const req = new Map<number, Equipment[]>([[1, ['barra']], [2, ['barra']]])

  it('matchea objetivo, nivel y equipamiento exactos', () => {
    const r = findPredefinedRoutine(
      { objective: 'volumen', level: 'intermedio', daysPerWeek: 4, equipment: ['barra'] },
      routines, req,
    )
    expect(r?.id).toBe(1)
  })

  it('NO matchea si falta parte del equipamiento (subconjunto)', () => {
    const reqBanca = new Map<number, Equipment[]>([[1, ['barra', 'banco']]])
    const r = findPredefinedRoutine(
      { objective: 'volumen', level: 'intermedio', daysPerWeek: 4, equipment: ['barra'] },
      routines, reqBanca,
    )
    expect(r).toBeUndefined()
  })

  it('NO relaja el nivel', () => {
    const r = findPredefinedRoutine(
      { objective: 'volumen', level: 'principiante', daysPerWeek: 4, equipment: ['barra'] },
      routines, req,
    )
    expect(r).toBeUndefined()
  })

  it('relaja los días: sin 5, ofrece la más cercana', () => {
    const r = findPredefinedRoutine(
      { objective: 'volumen', level: 'intermedio', daysPerWeek: 5, equipment: ['barra'] },
      routines, req,
    )
    expect(r?.id).toBe(1)
  })

  it('equipamiento vacío significa sin filtro', () => {
    const r = findPredefinedRoutine(
      { objective: 'volumen', level: 'avanzado', daysPerWeek: 4, equipment: [] },
      routines, req,
    )
    expect(r?.id).toBe(2)
  })

  it('ignora las rutinas custom', () => {
    const conCustom = [...routines, { ...routine(9, 'volumen', 'intermedio', 4), isCustom: true }]
    const r = findPredefinedRoutine(
      { objective: 'volumen', level: 'intermedio', daysPerWeek: 4, equipment: ['barra'] },
      conCustom, req,
    )
    expect(r?.id).toBe(1)
  })
})

describe('cobertura del catálogo curado (se mide, no se asume)', () => {
  const byId = new Map([...seedExercises, ...seedExercisesExtra].map((e) => [e.id, e]))
  const reqByRoutine = new Map(
    seedRoutines.map((r) => [r.id, requiredEquipmentOf(r.id, seedRoutineDays, seedRoutineItems, byId)]),
  )
  const OBJETIVOS = ['fuerza', 'volumen', 'resistencia', 'definicion', 'general'] as const
  const NIVELES = ['principiante', 'intermedio', 'avanzado'] as const

  it('el seed curado cubre 30 de 75 combos con dias EXACTOS', () => {
    let covered = 0
    for (const objective of OBJETIVOS) {
      for (const level of NIVELES) {
        for (let daysPerWeek = 2; daysPerWeek <= 6; daysPerWeek++) {
          const exact = seedRoutines.some(
            (r) => !r.isCustom && r.objective === objective && r.level === level && r.daysCount === daysPerWeek,
          )
          if (exact) covered++
        }
      }
    }
    // Cobertura CURADA del seed (spec, "Cobertura medida sobre el seed real"): cuantos de los
    // 75 combos (objetivo x nivel x dias 2-6) tienen una rutina predefinida con dias EXACTOS.
    // Es una propiedad del catalogo, NO del matcher: por eso se mide sobre seedRoutines y no
    // llamando a findPredefinedRoutine (ese relaja dias y daria 70, que es otra cantidad).
    // Si BAJA, el catalogo empeoro; si SUBE, se agrego una rutina que cubre un combo nuevo.
    // Actualizalo a mano y anotalo en la spec.
    expect(covered).toBe(30)
  })

  it('el matcher, relajando solo dias, cubre 70 de 75', () => {
    let covered = 0
    for (const objective of OBJETIVOS) {
      for (const level of NIVELES) {
        for (let daysPerWeek = 2; daysPerWeek <= 6; daysPerWeek++) {
          const hit = findPredefinedRoutine({ objective, level, daysPerWeek, equipment: [] }, seedRoutines, reqByRoutine)
          if (hit) covered++
        }
      }
    }
    // Dias es lo UNICO que se relaja ("dias exactos primero y, si no hay, la mas cercana"):
    // por eso el matcher cubre mas que el seed curado. Un (objetivo, nivel) con rutina cubre
    // sus 5 valores de dias. Los 5 combos que faltan son de (general, avanzado), que no tiene
    // ninguna rutina. Si BAJA, alguien endurecio el matcher; si SUBE, se agrego una rutina.
    expect(covered).toBe(70)
  })
})

describe('generateRoutinePlan', () => {
  // Catalogo sintetico: 2 ejercicios de barra por cada uno de los 8 grupos que usan los splits.
  const full = ['pecho', 'espalda', 'pierna', 'hombro', 'biceps', 'triceps', 'gluteo', 'abdomen'].flatMap((g, i) => [
    exG(i * 10 + 1, g as Exercise['muscleGroup'], ['barra']),
    exG(i * 10 + 2, g as Exercise['muscleGroup'], ['barra']),
  ])

  it('es determinista: misma entrada, misma salida', () => {
    const req = { level: 'intermedio', objective: 'volumen', daysPerWeek: 4, equipment: ['barra'] } as const
    expect(generateRoutinePlan(req, full)).toEqual(generateRoutinePlan(req, full))
  })

  it('produce exerciseId reales del catalogo', () => {
    const plan = generateRoutinePlan(
      { level: 'intermedio', objective: 'volumen', daysPerWeek: 4, equipment: ['barra'] },
      full,
    )
    const ids = new Set(full.map((e) => e.id))
    for (const day of plan.days) for (const item of day.items) expect(ids.has(item.exerciseId)).toBe(true)
  })

  it('nunca elige ejercicios de cardio, estiramiento o movilidad', () => {
    const conCardio = [...full, { ...exG(999, 'pierna', ['peso corporal']), category: 'cardio' as const }]
    const plan = generateRoutinePlan(
      { level: 'principiante', objective: 'general', daysPerWeek: 3, equipment: [] },
      conCardio,
    )
    for (const day of plan.days) for (const item of day.items) expect(item.exerciseId).not.toBe(999)
  })

  it('reporta los grupos que no pudo cubrir y cae los dias vacios', () => {
    const soloMancuernas = [exG(1, 'pecho', ['mancuernas'])]
    const plan = generateRoutinePlan(
      { level: 'principiante', objective: 'volumen', daysPerWeek: 4, equipment: ['mancuernas'] },
      soloMancuernas,
    )
    expect(plan.coverage.omittedGroups.length).toBeGreaterThan(0)
    for (const day of plan.days) expect(day.items.length).toBeGreaterThan(0)
  })

  it('equipamiento vacio usa todo el catalogo', () => {
    const plan = generateRoutinePlan(
      { level: 'principiante', objective: 'volumen', daysPerWeek: 3, equipment: [] },
      full,
    )
    expect(plan.days.length).toBeGreaterThan(0)
  })

  it('con varios equipos declarados sigue eligiendo: requerido ⊆ disponible', () => {
    // Regresión: el generador exigía que el ejercicio usara TODO lo declarado, así que
    // declarar barra + mancuernas vaciaba el plan (0 días, 7 grupos omitidos).
    // `full` son todos ['barra'], y con barra alcanza: siguen siendo elegibles.
    const plan = generateRoutinePlan(
      { level: 'avanzado', objective: 'general', daysPerWeek: 4, equipment: ['barra', 'mancuernas'] },
      full,
    )
    expect(plan.coverage.omittedGroups).toEqual([])
    expect(plan.days.length).toBeGreaterThan(0)
  })

  it('omite el grupo cuyo único ejercicio exige equipo que no tenés', () => {
    // Spec: con barra y sin banco, un press de banca (['barra', 'banco']) NO es disponible.
    const otros = ['espalda', 'pierna', 'hombro', 'biceps', 'triceps', 'gluteo', 'abdomen'] as const
    const catalogo = [
      exG(1, 'pecho', ['barra', 'banco']),
      ...otros.flatMap((g, i) => [
        exG(100 + i * 10 + 1, g, ['barra']),
        exG(100 + i * 10 + 2, g, ['barra']),
      ]),
    ]
    const plan = generateRoutinePlan(
      { level: 'avanzado', objective: 'general', daysPerWeek: 4, equipment: ['barra'] },
      catalogo,
    )
    expect(plan.coverage.omittedGroups).toContain('pecho')
    expect(plan.days.length).toBeGreaterThan(0)
  })

  it('no explota ni propaga NaN si el nivel o el objetivo llegan fuera del tipo', () => {
    // `level` y `objective` viajan desde datos persistidos (Dexie, localStorage), asi que el
    // tipo no es garantia en runtime. Sin guarda: TypeError por el nivel, NaN por el objetivo.
    const plan = generateRoutinePlan(
      {
        level: 'inventado' as unknown as Level,
        objective: 'inventado' as unknown as Objective,
        daysPerWeek: 4,
        equipment: ['barra'],
      },
      full,
    )
    expect(plan.days.length).toBeGreaterThan(0)
    for (const day of plan.days) {
      for (const item of day.items) {
        expect(Number.isFinite(item.targetSets)).toBe(true)
        expect(Number.isFinite(item.targetReps)).toBe(true)
        expect(Number.isFinite(item.restSec)).toBe(true)
      }
    }
  })
})

describe('planRoutine', () => {
  it('usa la predefinida cuando calza y no genera', () => {
    const routines = [routine(1, 'volumen', 'intermedio', 4)]
    const req = new Map([[1, ['barra'] as Equipment[]]])
    const plan = planRoutine(
      { level: 'intermedio', objective: 'volumen', daysPerWeek: 4, equipment: ['barra'] },
      routines,
      [],
      req,
      [],
      [],
    )
    expect(plan.source).toBe('predefined')
    expect(plan.basedOnId).toBe(1)
  })

  it('cae al generador cuando ninguna calza, y no deja basedOnId', () => {
    const plan = planRoutine(
      { level: 'intermedio', objective: 'volumen', daysPerWeek: 4, equipment: ['barra'] },
      [],
      [],
      new Map(),
      [],
      [],
    )
    expect(plan.source).toBe('generated')
    expect(plan.basedOnId).toBeUndefined()
  })

  it('convierte la predefinida: orden por dayIndex y order, y reporta el dia que cae', () => {
    const routines = [routine(1, 'volumen', 'intermedio', 4)]
    const req = new Map([[1, ['barra'] as Equipment[]]])
    const days: RoutineDay[] = [
      { id: 200, routineId: 1, dayIndex: 1, name: 'Día B' },
      { id: 100, routineId: 1, dayIndex: 0, name: 'Día A' },
      { id: 300, routineId: 1, dayIndex: 2, name: 'Día C' },
    ]
    const items: RoutineItem[] = [
      { id: 1, routineDayId: 100, exerciseId: 11, targetSets: 4, targetReps: 8, restSec: 120, order: 2 },
      { id: 2, routineDayId: 100, exerciseId: 10, targetSets: 3, targetReps: 10, restSec: 90, order: 1 },
      { id: 3, routineDayId: 200, exerciseId: 12, targetSets: 3, targetReps: 10, restSec: 90, order: 1 },
      // El día 300 no tiene ítems: cae del plan, pero la cobertura tiene que decirlo.
    ]
    const plan = planRoutine(
      { level: 'intermedio', objective: 'volumen', daysPerWeek: 5, equipment: ['barra'] },
      routines,
      [],
      req,
      days,
      items,
    )
    expect(plan.source).toBe('predefined')
    expect(plan.days.map((d) => d.name)).toEqual(['Día A', 'Día B'])
    expect(plan.days.map((d) => d.dayNumber)).toEqual([1, 2])
    expect(plan.days[0].items.map((i) => i.exerciseId)).toEqual([10, 11])
    expect(plan.days[0].items[0]).toEqual({ exerciseId: 10, targetSets: 3, targetReps: 10, restSec: 90 })
    expect(plan.coverage).toEqual({ omittedGroups: [], droppedDays: [3] })
  })

  it('una predefinida sin dias vacios no inventa caidas', () => {
    const routines = [routine(1, 'volumen', 'intermedio', 4)]
    const req = new Map([[1, ['barra'] as Equipment[]]])
    const days: RoutineDay[] = [{ id: 100, routineId: 1, dayIndex: 0, name: 'Día A' }]
    const items: RoutineItem[] = [
      { id: 1, routineDayId: 100, exerciseId: 10, targetSets: 3, targetReps: 10, restSec: 90, order: 1 },
    ]
    const plan = planRoutine(
      { level: 'intermedio', objective: 'volumen', daysPerWeek: 4, equipment: ['barra'] },
      routines,
      [],
      req,
      days,
      items,
    )
    expect(plan.coverage).toEqual({ omittedGroups: [], droppedDays: [] })
  })
})
