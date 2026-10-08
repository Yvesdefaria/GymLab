// Parsers de importación de datos desde otras apps (Strong, Hevy, JEFIT).
import type { Workout, WorkoutSet } from './types'
import { parseDecimal } from './numberGuard'

// Resuelve el nombre de un ejercicio del CSV al id del catálogo; null si no hay match.
export type ExerciseResolver = (name: string) => number | null

// Resultado parseado de una importación.
export interface ParsedImport {
  source: 'strong' | 'hevy' | 'jefit'
  workouts: Workout[]
  sets: WorkoutSet[]
  errors: string[]
  // Nombres únicos sin match en el catálogo (orden de primera aparición en el CSV).
  unmatched: string[]
}

// Fila válida normalizada por los parsers fuente (las columnas varían entre apps).
interface RawRow {
  date: string
  exercise: string
  weightKg: number
  reps: number
  completed: boolean
}

interface RowLayout {
  source: ParsedImport['source']
  minParts: number
  unpack: (parts: string[]) => RawRow
}

// Divide una línea CSV respetando comillas dobles: una coma decimal dentro de
// comillas ("16,5") no debe separar columnas. Mantiene el comportamiento previo
// para líneas sin comillas.
const splitCsvLine = (line: string): string[] => {
  const parts: string[] = []
  let current = ''
  let quoted = false
  for (const ch of line) {
    if (ch === '"') { quoted = !quoted; continue }
    if (ch === ',' && !quoted) { parts.push(current); current = ''; continue }
    current += ch
  }
  parts.push(current)
  return parts.map((p) => p.trim())
}

// Peso CSV normalizado: acepta coma o punto decimal; NaN cuando el texto no es
// numérico para que el llamador lo reporte como línea inválida.
const parseCsvWeight = (raw: string | undefined): number => {
  const parsed = parseDecimal(raw ?? '')
  return parsed.ok ? parsed.value : Number.NaN
}

// Reagrupa las filas válidas: un workout por fecha (orden ascendente) con sus
// series agrupadas por ejercicio (orden de aparición) y setNumber 1..n. El
// totalVolume solo suma series completadas, igual que al guardar una sesión.
const buildParsedImport = (
  source: ParsedImport['source'],
  rows: RawRow[],
  errors: string[],
  resolver?: ExerciseResolver
): ParsedImport => {
  const sessions = new Map<string, { date: string; totalVolume: number; rows: RawRow[] }>()
  for (const row of rows) {
    let session = sessions.get(row.date)
    if (!session) {
      session = { date: row.date, totalVolume: 0, rows: [] }
      sessions.set(row.date, session)
    }
    session.rows.push(row)
    if (row.completed) session.totalVolume += row.weightKg * row.reps
  }

  const unmatched = new Set<string>()
  // Cache por nombre: el resolver se evalúa una vez por ejercicio, no por fila.
  const idsByName = new Map<string, number>()
  const resolveId = (name: string): number => {
    const cached = idsByName.get(name)
    if (cached !== undefined) return cached
    const match = resolver?.(name) ?? null
    if (resolver && match === null) unmatched.add(name)
    const id = match ?? hashCode(name)
    idsByName.set(name, id)
    return id
  }

  const workouts: Workout[] = []
  const sets: WorkoutSet[] = []
  let setId = 0

  const ordered = [...sessions.values()].sort((a, b) => a.date.localeCompare(b.date))
  ordered.forEach((session, index) => {
    const workoutId = index + 1
    const at = `${session.date}T00:00:00`
    workouts.push({
      id: workoutId,
      startedAt: at,
      localDate: session.date,
      finishedAt: at,
      routineId: null,
      routineDayId: null,
      notes: '',
      totalVolume: session.totalVolume,
    })

    const groups = new Map<string, RawRow[]>()
    for (const row of session.rows) {
      const group = groups.get(row.exercise)
      if (group) group.push(row)
      else groups.set(row.exercise, [row])
    }
    for (const [exercise, groupRows] of groups) {
      const exerciseId = resolveId(exercise)
      groupRows.forEach((row, i) => {
        setId += 1
        sets.push({
          id: setId,
          workoutId,
          exerciseId,
          setNumber: i + 1,
          weightKg: row.weightKg,
          reps: row.reps,
          completed: row.completed,
          createdAt: at,
        })
      })
    }
  })

  return { source, workouts, sets, errors, unmatched: [...unmatched] }
}

// Lógica común de los 3 parsers CSV: cabecera, validaciones y reagrupado.
const parseWeightRepsCSV = (
  csv: string,
  layout: RowLayout,
  resolver?: ExerciseResolver
): ParsedImport => {
  const lines = csv.trim().split('\n')
  const errors: string[] = []
  const rows: RawRow[] = []

  if (lines.length < 2) {
    errors.push('CSV vacío o sin datos')
    return { source: layout.source, workouts: [], sets: [], errors, unmatched: [] }
  }

  for (let i = 1; i < lines.length; i++) {
    const parts = splitCsvLine(lines[i] ?? '')
    if (parts.length < layout.minParts) { errors.push(`Línea ${i + 1}: formato inválido`); continue }

    const { date, exercise, weightKg, reps, completed } = layout.unpack(parts)
    if (isNaN(weightKg) || isNaN(reps)) {
      errors.push(`Línea ${i + 1}: peso o reps inválidos`)
      continue
    }

    rows.push({ date, exercise, weightKg, reps, completed })
  }

  return buildParsedImport(layout.source, rows, errors, resolver)
}

// Layout común de 5/6 columnas: date, exercise, weight, reps[, sets], completed.
// El setNumber del archivo se ignora: se renumera 1..n al agrupar por ejercicio.
const weightRepsLayout = (source: ParsedImport['source'], hasSets = false): RowLayout => ({
  source,
  minParts: hasSets ? 6 : 5,
  unpack: (parts) => ({
    date: parts[0] ?? '',
    exercise: parts[1] ?? '',
    weightKg: parseCsvWeight(parts[2]),
    reps: parseInt(parts[3] ?? '', 10),
    completed: parts[hasSets ? 5 : 4] !== 'No',
  }),
})

// Parsea CSV de Strong.
export const parseStrongCSV = (csv: string, resolver?: ExerciseResolver): ParsedImport =>
  parseWeightRepsCSV(csv, weightRepsLayout('strong'), resolver)

// Parsea CSV de Hevy (6 columnas; la de "Sets" se consume pero se renumera).
export const parseHevyCSV = (csv: string, resolver?: ExerciseResolver): ParsedImport =>
  parseWeightRepsCSV(csv, weightRepsLayout('hevy', true), resolver)

// Parsea CSV de JEFIT (mismo layout que Strong).
export const parseJEFITCSV = (csv: string, resolver?: ExerciseResolver): ParsedImport =>
  parseWeightRepsCSV(csv, weightRepsLayout('jefit'), resolver)

// Hash simple para generar IDs numéricos a partir de strings.
const hashCode = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

// Parser por nombre de app.
export const parseImport = (
  csv: string,
  source: 'strong' | 'hevy' | 'jefit',
  resolver?: ExerciseResolver
): ParsedImport => {
  switch (source) {
    case 'strong': return parseStrongCSV(csv, resolver)
    case 'hevy': return parseHevyCSV(csv, resolver)
    case 'jefit': return parseJEFITCSV(csv, resolver)
  }
}

// Auto-detecta el formato del CSV por la primera línea (header). El orden importa:
// `exercise_name` (JEFIT) y `sets` (Hevy) desambiguan sus headers, que también
// contienen `date`+`exercise` como el de Strong.
export const autoDetectAndParse = (csv: string, resolver?: ExerciseResolver): ParsedImport => {
  const header = csv.trim().split('\n')[0]?.toLowerCase() ?? ''
  if (header.includes('exercise_name')) return parseJEFITCSV(csv, resolver)
  if (header.includes('sets')) return parseHevyCSV(csv, resolver)
  if (header.includes('date') && header.includes('exercise')) return parseStrongCSV(csv, resolver)
  return {
    source: 'strong',
    workouts: [],
    sets: [],
    errors: ['Formato CSV no reconocido. Usa exportaciones de Strong, Hevy o JEFIT.'],
    unmatched: [],
  }
}
