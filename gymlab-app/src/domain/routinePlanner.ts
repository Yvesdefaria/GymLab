// Planificador de rutinas: genera rutina semanal según nivel, objetivo y equipamiento.
import type { Equipment, Objective, Level, MuscleGroup } from './types'

export interface PlannerInput {
  level: Level
  objective: Objective
  equipment: Equipment[]
  daysPerWeek: number
}

export interface PlannedDay {
  dayNumber: number
  nameKey: string
  muscleGroups: MuscleGroup[]
  exercises: PlannedExercise[]
}

export interface PlannedExercise {
  muscleGroup: MuscleGroup
  sets: number
  reps: string // "8-12", "3-5", etc.
  equipment: Equipment
  restSeconds: number
}

// Volumen semanal óptimo por nivel y objetivo (series por grupo muscular).
const volumeByLevel: Record<Level, Record<Objective, number>> = {
  principiante: { fuerza: 10, volumen: 10, resistencia: 12, definicion: 10, general: 10 },
  intermedio: { fuerza: 12, volumen: 14, resistencia: 15, definicion: 12, general: 12 },
  avanzado: { fuerza: 14, volumen: 16, resistencia: 18, definicion: 14, general: 14 },
}

// Repeticiones por objetivo.
const repsByObjective: Record<Objective, string> = {
  fuerza: '3-5',
  volumen: '8-12',
  resistencia: '15-20',
  definicion: '10-15',
  general: '8-12',
}

// Descanso por objetivo (segundos).
const restByObjective: Record<Objective, number> = {
  fuerza: 180,
  volumen: 90,
  resistencia: 45,
  definicion: 60,
  general: 90,
}

// Split por defecto según días por semana.
const splitByDays: Record<number, MuscleGroup[][]> = {
  3: [['pecho', 'espalda', 'pierna']],
  4: [['pecho', 'hombro'], ['espalda', 'biceps'], ['pierna', 'gluteo'], ['pierna', 'abdomen']],
  5: [['pecho', 'triceps'], ['espalda', 'biceps'], ['pierna'], ['hombro', 'trapecios'], ['pierna', 'gluteo']],
  6: [['pecho'], ['espalda'], ['pierna'], ['hombro', 'trapecios'], ['biceps', 'triceps'], ['pierna', 'gluteo']],
}

// Mapa de grupos musculares a equipment preferido.
const equipmentPreference: Record<MuscleGroup, Equipment> = {
  pecho: 'barra',
  espalda: 'barra',
  biceps: 'mancuernas',
  triceps: 'polea',
  hombro: 'mancuernas',
  pierna: 'barra',
  gluteo: 'barra',
  abdomen: 'peso corporal',
  trapecios: 'mancuernas',
  antebrazo: 'mancuernas',
}

// Genera rutina semanal.
export const generateRoutine = (input: PlannerInput): PlannedDay[] => {
  const days = Math.min(Math.max(input.daysPerWeek, 3), 6)
  const muscleGroupsPerDay = splitByDays[days] ?? splitByDays[3]
  const weeklyVolume = volumeByLevel[input.level]?.[input.objective] ?? 12

  return muscleGroupsPerDay.map((groups, i) => {
    const exercisesPerGroup = Math.ceil(weeklyVolume / groups.length / 3) // ~3-4 series por ejercicio
    const exercises: PlannedExercise[] = []

    for (const group of groups) {
      const preferred = input.equipment.includes(equipmentPreference[group])
        ? equipmentPreference[group]
        : input.equipment[0] ?? 'peso corporal'

      exercises.push({
        muscleGroup: group,
        sets: exercisesPerGroup,
        reps: repsByObjective[input.objective],
        equipment: preferred,
        restSeconds: restByObjective[input.objective],
      })
    }

    return {
      dayNumber: i + 1,
      nameKey: `planner.day${i + 1}`,
      muscleGroups: groups,
      exercises,
    }
  })
}
