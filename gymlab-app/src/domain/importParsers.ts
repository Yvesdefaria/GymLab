// Parsers de importación de datos desde otras apps (Strong, Hevy, JEFIT).
import type { Workout, WorkoutSet } from './types'

// Resultado parseado de una importación.
export interface ParsedImport {
  source: 'strong' | 'hevy' | 'jefit'
  workouts: Workout[]
  sets: WorkoutSet[]
  errors: string[]
}

// Fila normalizada por parser fuente (las columnas varían entre apps).
interface RowLayout {
  source: ParsedImport['source']
  minParts: number
  unpack: (parts: string[]) => {
    date: string
    exercise: string
    weightKg: number
    reps: number
    setNumber: number
    completed: boolean
  }
}

// Lógica común de los 3 parsers CSV (cabecera, validaciones y construcción de sets).
const parseWeightRepsCSV = (csv: string, layout: RowLayout): ParsedImport => {
  const lines = csv.trim().split('\n')
  const workouts: Workout[] = []
  const sets: WorkoutSet[] = []
  const errors: string[] = []

  if (lines.length < 2) {
    errors.push('CSV vacío o sin datos')
    return { source: layout.source, workouts, sets, errors }
  }

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]?.split(',').map((p) => p.trim()) ?? []
    if (parts.length < layout.minParts) { errors.push(`Línea ${i + 1}: formato inválido`); continue }

    const { date, exercise, weightKg, reps, setNumber, completed } = layout.unpack(parts)

    if (isNaN(weightKg) || isNaN(reps)) {
      errors.push(`Línea ${i + 1}: peso o reps inválidos`)
      continue
    }

    workouts.push({
      id: i,
      startedAt: `${date}T00:00:00`,
      localDate: date,
      finishedAt: `${date}T00:00:00`,
      routineId: null,
      routineDayId: null,
      notes: '',
      totalVolume: weightKg * reps,
    })

    sets.push({
      id: i,
      workoutId: i,
      exerciseId: hashCode(exercise ?? ''),
      setNumber,
      weightKg,
      reps,
      completed,
      createdAt: `${date}T00:00:00`,
    })
  }

  return { source: layout.source, workouts, sets, errors }
}

// Parsea CSV de Strong.
export const parseStrongCSV = (csv: string): ParsedImport =>
  parseWeightRepsCSV(csv, strongJefitLayout('strong'))

// Parsea CSV de Hevy (incluye columna "Sets" para el número de serie).
export const parseHevyCSV = (csv: string): ParsedImport =>
  parseWeightRepsCSV(csv, {
    source: 'hevy',
    minParts: 6,
    unpack: ([date, exercise, weightStr, repsStr, setsStr, completedStr]) => ({
      date: date ?? '',
      exercise: exercise ?? '',
      weightKg: parseFloat(weightStr ?? ''),
      reps: parseInt(repsStr ?? '', 10),
      setNumber: parseInt(setsStr ?? '1', 10),
      completed: completedStr !== 'No',
    }),
  })

// Parsea CSV de JEFIT (mismo layout que Strong).
export const parseJEFITCSV = (csv: string): ParsedImport =>
  parseWeightRepsCSV(csv, strongJefitLayout('jefit'))

// Layout compartido Strong/JEFIT (5 columnas: date, exercise, weight, reps, completed).
const strongJefitLayout = (source: 'strong' | 'jefit'): RowLayout => ({
  source,
  minParts: 5,
  unpack: ([date, exercise, weightStr, repsStr, completedStr]) => ({
    date: date ?? '',
    exercise: exercise ?? '',
    weightKg: parseFloat(weightStr ?? ''),
    reps: parseInt(repsStr ?? '', 10),
    setNumber: 1,
    completed: completedStr !== 'No',
  }),
})

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

// Auto-detecta el formato del CSV por la primera línea (header).
export const autoDetectAndParse = (csv: string): ParsedImport => {
  const header = csv.trim().split('\n')[0]?.toLowerCase() ?? ''
  if (header.includes('date') && header.includes('exercise')) return parseStrongCSV(csv)
  if (header.includes('date') && header.includes('weight')) return parseHevyCSV(csv)
  if (header.includes('date') && header.includes('exercise_name')) return parseJEFITCSV(csv)
  return {
    source: 'strong',
    workouts: [],
    sets: [],
    errors: ['Formato CSV no reconocido. Usa exportaciones de Strong, Hevy o JEFIT.'],
  }
}
