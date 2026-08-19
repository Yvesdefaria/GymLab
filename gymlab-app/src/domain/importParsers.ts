// Parsers de importación de datos desde otras apps (Strong, Hevy, JEFIT).
import type { Workout, WorkoutSet } from './types'

// Resultado parseado de una importación.
export interface ParsedImport {
  source: 'strong' | 'hevy' | 'jefit'
  workouts: Workout[]
  sets: WorkoutSet[]
  errors: string[]
}

// Parsea CSV de Strong.
export const parseStrongCSV = (csv: string): ParsedImport => {
  const lines = csv.trim().split('\n')
  const workouts: Workout[] = []
  const sets: WorkoutSet[] = []
  const errors: string[] = []

  if (lines.length < 2) {
    errors.push('CSV vacío o sin datos')
    return { source: 'strong', workouts, sets, errors }
  }

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]?.split(',').map((p) => p.trim()) ?? []
    if (parts.length < 5) { errors.push(`Línea ${i + 1}: formato inválido`); continue }

    const [dateStr, exercise, weightStr, repsStr, completedStr] = parts
    const weightKg = parseFloat(weightStr ?? '')
    const reps = parseInt(repsStr ?? '', 10)
    const completed = completedStr !== 'No'

    if (isNaN(weightKg) || isNaN(reps)) {
      errors.push(`Línea ${i + 1}: peso o reps inválidos`)
      continue
    }

    workouts.push({
      id: i,
      startedAt: `${dateStr}T00:00:00`,
      localDate: dateStr ?? '',
      finishedAt: `${dateStr}T00:00:00`,
      routineId: null,
      routineDayId: null,
      notes: '',
      totalVolume: weightKg * reps,
    })

    sets.push({
      id: i,
      workoutId: i,
      exerciseId: hashCode(exercise ?? ''),
      setNumber: 1,
      weightKg,
      reps,
      completed,
      createdAt: `${dateStr}T00:00:00`,
    })
  }

  return { source: 'strong', workouts, sets, errors }
}

// Parsea CSV de Hevy.
export const parseHevyCSV = (csv: string): ParsedImport => {
  const lines = csv.trim().split('\n')
  const workouts: Workout[] = []
  const sets: WorkoutSet[] = []
  const errors: string[] = []

  if (lines.length < 2) {
    errors.push('CSV vacío o sin datos')
    return { source: 'hevy', workouts, sets, errors }
  }

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]?.split(',').map((p) => p.trim()) ?? []
    if (parts.length < 6) { errors.push(`Línea ${i + 1}: formato inválido`); continue }

    const [dateStr, exercise, weightStr, repsStr, setsStr, completedStr] = parts
    const weightKg = parseFloat(weightStr ?? '')
    const reps = parseInt(repsStr ?? '', 10)
    const completed = completedStr !== 'No'

    if (isNaN(weightKg) || isNaN(reps)) {
      errors.push(`Línea ${i + 1}: peso o reps inválidos`)
      continue
    }

    workouts.push({
      id: i,
      startedAt: `${dateStr}T00:00:00`,
      localDate: dateStr ?? '',
      finishedAt: `${dateStr}T00:00:00`,
      routineId: null,
      routineDayId: null,
      notes: '',
      totalVolume: weightKg * reps,
    })

    sets.push({
      id: i,
      workoutId: i,
      exerciseId: hashCode(exercise ?? ''),
      setNumber: parseInt(setsStr ?? '1', 10),
      weightKg,
      reps,
      completed,
      createdAt: `${dateStr}T00:00:00`,
    })
  }

  return { source: 'hevy', workouts, sets, errors }
}

// Parsea CSV de JEFIT.
export const parseJEFITCSV = (csv: string): ParsedImport => {
  const lines = csv.trim().split('\n')
  const workouts: Workout[] = []
  const sets: WorkoutSet[] = []
  const errors: string[] = []

  if (lines.length < 2) {
    errors.push('CSV vacío o sin datos')
    return { source: 'jefit', workouts, sets, errors }
  }

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]?.split(',').map((p) => p.trim()) ?? []
    if (parts.length < 5) { errors.push(`Línea ${i + 1}: formato inválido`); continue }

    const [dateStr, exercise, weightStr, repsStr, completedStr] = parts
    const weightKg = parseFloat(weightStr ?? '')
    const reps = parseInt(repsStr ?? '', 10)
    const completed = completedStr !== 'No'

    if (isNaN(weightKg) || isNaN(reps)) {
      errors.push(`Línea ${i + 1}: peso o reps inválidos`)
      continue
    }

    workouts.push({
      id: i,
      startedAt: `${dateStr}T00:00:00`,
      localDate: dateStr ?? '',
      finishedAt: `${dateStr}T00:00:00`,
      routineId: null,
      routineDayId: null,
      notes: '',
      totalVolume: weightKg * reps,
    })

    sets.push({
      id: i,
      workoutId: i,
      exerciseId: hashCode(exercise ?? ''),
      setNumber: 1,
      weightKg,
      reps,
      completed,
      createdAt: `${dateStr}T00:00:00`,
    })
  }

  return { source: 'jefit', workouts, sets, errors }
}

// Hash simple para generar IDs numéricos a partir de strings.
const hashCode = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

// Parser por nombre de app.
export const parseImport = (csv: string, source: 'strong' | 'hevy' | 'jefit'): ParsedImport => {
  switch (source) {
    case 'strong': return parseStrongCSV(csv)
    case 'hevy': return parseHevyCSV(csv)
    case 'jefit': return parseJEFITCSV(csv)
  }
}
