// Red de seguridad de la auditoría H1–H17: un caso por hallazgo. Los corregidos
// corren; los abiertos quedan como `it.skip` con la conducta deseada para activarlos
// en el mismo commit que los corrija. La definición vive en docs/METRICS-CONTRACT.md.
import { describe, expect, it } from 'vitest'
import {
  bestPRsFromSets,
  detectPRsFromSets,
  estimate1RM,
  estimate1RMValue,
} from '@/domain/prs'
import { estimate1RM as benchmarkEstimate } from '@/domain/benchmark'
import { calcTotalVolume } from '@/domain/volume'
import { buildE1rmSeries } from '@/domain/e1rm'
import { volumeByMuscleGroup } from '@/domain/trainingStats'
import { buildWeeklyVolumeSeries as buildTrainingWeekly } from '@/domain/trainingStats'
import { buildWeeklyVolumeSeries as buildWeeklyVolume } from '@/domain/weeklyVolume'
import { calcStreak } from '@/domain/streak'
import { fatigueMap } from '@/domain/muscleFatigue'
import { buildGoalProjections } from '@/domain/goalProjection'
import { avgE1rmInGroupRange, groupSetsByExercise } from '@/domain/setStats'
import { getStrengthLevel, getStrengthThresholds } from '@/domain/strengthStandards'
import { classifyNavy } from '@/domain/calculators/navy'
import { bodyFatCategory, buildBodyCompSeries } from '@/domain/calculators/bodyComposition'
import { adjustTdeeForSteps } from '@/domain/nutrition'
import { calcDailyWater } from '@/domain/calculators/water'
import { addLocalDays, toLocalDateStr, weekStartKey } from '@/domain/dates'
import type { Exercise, SkinfoldEntry, Workout, WorkoutSet } from '@/domain/types'

const set = (over: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: 1,
  workoutId: 1,
  exerciseId: 7,
  setNumber: 1,
  weightKg: 80,
  reps: 5,
  completed: true,
  createdAt: '2026-10-20T18:05:00.000Z',
  ...over,
})

const workout = (id: number, localDate: string): Workout => ({
  id,
  startedAt: `${localDate}T18:00:00.000Z`,
  finishedAt: `${localDate}T19:00:00.000Z`,
  routineId: null,
  routineDayId: null,
  localDate,
  notes: '',
})

const exercise = (id = 7): Exercise => ({
  id,
  slug: `ejercicio-${id}`,
  name: `Ejercicio ${id}`,
  muscleGroup: 'pecho',
  equipment: ['barra'],
  instructions: '',
})

describe('H1 — un warmup no puede crear un PR', () => {
  it('el PR sale del trabajo, no del calentamiento', () => {
    const prs = detectPRsFromSets(
      [
        set({ id: 1, weightKg: 40, reps: 20, isWarmup: true }),
        set({ id: 2, weightKg: 60, reps: 5 }),
      ],
      []
    )
    expect(prs).toHaveLength(1)
    expect(prs[0]).toMatchObject({ weightKg: 60, reps: 5 })
  })
})

describe('H2 — Brzycki no explota antes del guard', () => {
  it('36 reps no estima y el contrato numérico devuelve 0', () => {
    expect(estimate1RMValue(20, 36)).toBeNull()
    expect(estimate1RM(20, 36)).toBe(0)
  })
})

describe('H3 — una sola fórmula de 1RM', () => {
  it('benchmark y PR coinciden; el benchmark no devuelve Infinity', () => {
    expect(benchmarkEstimate(100, 5)).toBe(estimate1RM(100, 5))
    expect(benchmarkEstimate(100, 37)).toBe(0)
  })
})

describe('H4 — los warmups quedan fuera de las métricas', () => {
  it('volumen, serie de e1RM y volumen muscular ignoran el calentamiento', () => {
    const workouts = new Map([[1, workout(1, '2026-10-20')]])
    const exercises = new Map([[7, exercise()]])
    const sets = [
      set({ id: 1, weightKg: 30, reps: 20, isWarmup: true }),
      set({ id: 2, weightKg: 80, reps: 5 }),
    ]

    expect(calcTotalVolume(sets)).toBe(400)
    expect(buildE1rmSeries(sets, workouts)).toEqual([
      { date: '2026-10-20T18:00:00.000Z', estimated1RM: 90 },
    ])
    expect(volumeByMuscleGroup(sets, workouts, exercises)).toEqual([
      { muscle: 'pecho', volume: 400 },
    ])
  })
})

describe('H5 — una serie con 0 reps no crea PR', () => {
  it('no hay récord fantasma', () => {
    expect(detectPRsFromSets([set({ weightKg: 50, reps: 0 })], [])).toHaveLength(0)
    expect(bestPRsFromSets([set({ weightKg: 50, reps: 0 })])).toEqual([])
  })
})

describe('H6 — la racha se adapta al plan', () => {
  it('un plan de 2 días cumple con 2 sesiones por semana', () => {
    const monday = weekStartKey(toLocalDateStr())
    const dates = [monday, addLocalDays(monday, 2)]
    expect(calcStreak(dates, 2).currentStreak).toBe(1)
  })
})

describe('H7 — la fatiga usa la hora real', () => {
  it('ayer 20:00 consultado a las 09:00 son 13 h → sore', () => {
    const fatigue = fatigueMap(
      { pecho: new Date('2026-10-20T20:00:00') },
      new Date('2026-10-21T09:00:00')
    )
    expect(fatigue.pecho).toBe('sore')
  })
})

describe('H8 — la proyección no inventa mejora', () => {
  it('con tendencia negativa no promete fecha', () => {
    const sets = [
      set({ id: 1, weightKg: 100, reps: 1, createdAt: '2026-09-15T10:00:00.000Z' }),
      set({ id: 2, weightKg: 80, reps: 1, createdAt: '2026-10-20T10:00:00.000Z' }),
    ]
    const [projection] = buildGoalProjections(
      sets,
      [{ id: 7, name: 'Ejercicio 7' }],
      { 7: 120 },
      new Date('2026-10-27T12:00:00')
    )
    expect(projection?.estimatedDate).toBeNull()
  })
})

describe('H9 — el e1RM medio es por sesión', () => {
  it('una sesión de 10 series no pesa 10 veces más', () => {
    const heavy = Array.from({ length: 10 }, (_, index) =>
      set({ id: index + 1, workoutId: 1, weightKg: 100, reps: 1 })
    )
    const light = set({ id: 11, workoutId: 2, weightKg: 70, reps: 1 })
    const byExercise = groupSetsByExercise([...heavy, light])
    expect(avgE1rmInGroupRange(byExercise, 7, '2026-10-01', '2026-11-01')).toBe(85)
  })
})

describe('H10 — restore real y schema versionado', () => {
  it.skip('una tabla vacía del backup borra la actual (cubierto en backup.test.ts)', () => {
    // Se mantiene como recordatorio del contrato; el caso ejecutable vive en
    // tests/unit/data/backup.test.ts (replace + rechazo de schema futuro).
    expect(true).toBe(true)
  })
})

describe('H11 — una sola serie de volumen semanal', () => {
  it('ambas implementaciones devuelven lo mismo', () => {
    const workouts = [workout(1, '2026-10-20'), workout(2, '2026-10-06')]
    const volumes = new Map([
      [1, 1500],
      [2, 800],
    ])
    const a = buildTrainingWeekly(workouts, volumes)
    const b = buildWeeklyVolume(
      workouts,
      volumes,
      5,
      new Date('2026-10-24T12:00:00'),
      false,
      true
    ).map((point) => ({ week: point.weekStart, volume: point.volume }))
    expect(a).toEqual(b)
  })
})

describe('H12 — una sola clasificación de grasa (abierto)', () => {
  it.skip('17,5 % en hombre debe dar la misma etiqueta en Navy y JP', () => {
    expect(classifyNavy(17.5, 'hombre')).toBe('fitness')
    expect(bodyFatCategory(17.5, 'male')).toBe('en_forma')
  })
})

describe('H13 — percentiles femeninos', () => {
  it('usa la tabla de mujeres y no la masculina', () => {
    expect(getStrengthThresholds('sentadilla', 80, 'female')).toEqual([66, 88, 112, 138])
    expect(getStrengthLevel('sentadilla', 88, 80, 'female')).toBe('intermedio')
  })
})

describe('H14 — masa ósea sin altura inventada (abierto)', () => {
  it.skip('sin altura, hueso y músculo deben ser null', () => {
    const entry: SkinfoldEntry = {
      id: 1,
      localDate: '2026-10-20',
      sex: 'male',
      age: 30,
      weightKg: 80,
      sites: { pectoral: 10, abdominal: 20, muslo: 15 },
      createdAt: '2026-10-20T10:00:00.000Z',
    }
    expect(buildBodyCompSeries([entry])[0]?.boneMassKg).toBeNull()
  })
})

describe('H15 — TDEE y pasos sin doble conteo (abierto)', () => {
  it.skip('con actividad declarada no se suman los pasos otra vez', () => {
    expect(adjustTdeeForSteps(2000, 10000)).toBe(2000)
  })
})

describe('H16 — agua coherente con su fuente', () => {
  it('80 kg + 60 min da 3,0 L (0,6 L/h)', () => {
    expect(calcDailyWater(80, 60)).toBe(3)
  })
})

describe('H17 — peso corporal en reps separadas (abierto)', () => {
  it.skip('10 dominadas deben aportar 10 reps, no 0 kg de volumen', () => {
    expect(calcTotalVolume([set({ weightKg: 0, reps: 10 })])).toBe(10)
  })
})
