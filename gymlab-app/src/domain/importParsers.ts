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
  // Series descartadas por no tener match: nunca se persisten con un id sintético.
  discardedSets: number
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
  // null = fila inválida (p. ej. valor de completed desconocido).
  unpack: (parts: string[]) => RawRow | null
}

interface CsvRecord {
  fields: string[]
  // Línea física (1-based) donde empieza el registro.
  line: number
}

interface CsvParse {
  records: CsvRecord[]
  unterminatedQuote: boolean
}

// Separa el CSV completo en registros respetando comillas: una coma dentro de
// comillas no separa columnas, `""` es una comilla escapada y un salto de línea
// dentro de comillas pertenece al campo (F139.11). Devuelve la línea física de
// cada registro y marca si el archivo termina dentro de comillas (F140.4).
const parseCsvRecords = (csv: string): CsvParse => {
  const records: CsvRecord[] = []
  let fields: string[] = []
  let field = ''
  let quoted = false
  let line = 1
  let startLine = 1

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i]!
    if (quoted) {
      if (ch === '\r') continue
      if (ch === '"') {
        if (csv[i + 1] === '"') { field += '"'; i++ }
        else quoted = false
      } else {
        if (ch === '\n') line++
        field += ch
      }
      continue
    }
    if (ch === '"') { quoted = true; continue }
    if (ch === ',') { fields.push(field.trim()); field = ''; continue }
    if (ch === '\n') {
      fields.push(field.trim())
      records.push({ fields, line: startLine })
      fields = []
      field = ''
      line++
      startLine = line
      continue
    }
    if (ch === '\r') continue
    field += ch
  }

  if (quoted) return { records, unterminatedQuote: true }
  if (field !== '' || fields.length > 0) {
    fields.push(field.trim())
    records.push({ fields, line: startLine })
  }
  return { records, unterminatedQuote: false }
}

// Fallback línea por línea para archivos con comillas sin cerrar: conserva la
// recuperación del parser previo, donde una comilla rota no se lleva las filas
// siguientes (F140.4).
const splitCsvLine = (text: string): string[] => {
  const fields: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; continue }
      quoted = !quoted
      continue
    }
    if (ch === ',' && !quoted) { fields.push(field.trim()); field = ''; continue }
    field += ch
  }
  fields.push(field.trim())
  return fields
}

const splitCsvLines = (csv: string): CsvRecord[] =>
  csv.split(/\r?\n/).map((text, i) => ({ fields: splitCsvLine(text), line: i + 1 }))

// Valores aceptados de la columna "completed" (case-insensitive). Vacío conserva
// el comportamiento previo (true); un valor no vacío desconocido es error de línea
// (F139.12, compatibilidad F140.5).
const COMPLETED_FALSE = new Set(['no', 'false', '0', 'n'])
const COMPLETED_TRUE = new Set(['yes', 'true', '1', 's'])
const parseCompleted = (raw: string | undefined): boolean | null => {
  const value = (raw ?? '').trim().toLowerCase()
  if (value === '') return true
  if (COMPLETED_FALSE.has(value)) return false
  if (COMPLETED_TRUE.has(value)) return true
  return null
}

// Peso CSV normalizado: acepta coma o punto decimal; NaN cuando el texto no es
// numérico para que el llamador lo reporte como línea inválida.
const parseCsvWeight = (raw: string | undefined): number => {
  const parsed = parseDecimal(raw ?? '')
  return parsed.ok ? parsed.value : Number.NaN
}

// Reagrupa las filas válidas: un workout por fecha (orden ascendente) con sus
// series agrupadas por ejercicio (orden de aparición) y setNumber 1..n. El volumen
// es derivado: no se persiste en la cabecera de la sesión.
const buildParsedImport = (
  source: ParsedImport['source'],
  rows: RawRow[],
  errors: string[],
  resolver?: ExerciseResolver
): ParsedImport => {
  const sessions = new Map<string, { date: string; rows: RawRow[] }>()
  for (const row of rows) {
    let session = sessions.get(row.date)
    if (!session) {
      session = { date: row.date, rows: [] }
      sessions.set(row.date, session)
    }
    session.rows.push(row)
  }

  const unmatched = new Set<string>()
  // Cache por nombre: el resolver se evalúa una vez por ejercicio, no por fila.
  // null = sin match: la serie se descarta (F139.10). Sin resolver se conserva el
  // fallback hashCode para no romper llamadas que parsean sin catálogo.
  const idsByName = new Map<string, number | null>()
  const resolveId = (name: string): number | null => {
    if (idsByName.has(name)) return idsByName.get(name) ?? null
    let id: number | null
    if (resolver) {
      id = resolver(name) ?? null
      if (id === null) unmatched.add(name)
    } else {
      id = hashCode(name)
    }
    idsByName.set(name, id)
    return id
  }

  const workouts: Workout[] = []
  const sets: WorkoutSet[] = []
  let setId = 0
  let discardedSets = 0

  const ordered = [...sessions.values()].sort((a, b) => a.date.localeCompare(b.date))
  ordered.forEach((session) => {
    const at = `${session.date}T00:00:00`
    const groups = new Map<string, RawRow[]>()
    for (const row of session.rows) {
      const group = groups.get(row.exercise)
      if (group) group.push(row)
      else groups.set(row.exercise, [row])
    }

    // Primero se resuelven los ejercicios: una sesión sin ninguna serie resuelta
    // no se crea (no queda un entreno vacío con ids huérfanos).
    const kept: Array<{ exerciseId: number; rows: RawRow[] }> = []
    for (const [exercise, groupRows] of groups) {
      const exerciseId = resolveId(exercise)
      if (exerciseId === null) {
        discardedSets += groupRows.length
        continue
      }
      kept.push({ exerciseId, rows: groupRows })
    }
    if (kept.length === 0) return

    const workoutId = workouts.length + 1
    workouts.push({
      id: workoutId,
      startedAt: at,
      localDate: session.date,
      finishedAt: at,
      routineId: null,
      routineDayId: null,
      notes: '',
    })
    for (const { exerciseId, rows } of kept) {
      rows.forEach((row, i) => {
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

  return { source, workouts, sets, errors, unmatched: [...unmatched], discardedSets }
}

// Lógica común de los 3 parsers CSV: cabecera, validaciones y reagrupado.
const parseWeightRepsCSV = (
  csv: string,
  layout: RowLayout,
  resolver?: ExerciseResolver
): ParsedImport => {
  const parsed = parseCsvRecords(csv.trim())
  const records = parsed.unterminatedQuote ? splitCsvLines(csv.trim()) : parsed.records
  const errors: string[] = []
  const rows: RawRow[] = []

  if (parsed.unterminatedQuote) {
    errors.push('CSV con comillas sin cerrar; se recuperó línea por línea')
  }

  if (records.length < 2) {
    errors.push('CSV vacío o sin datos')
    return { source: layout.source, workouts: [], sets: [], errors, unmatched: [], discardedSets: 0 }
  }

  for (let i = 1; i < records.length; i++) {
    const record = records[i]!
    const parts = record.fields
    if (parts.length < layout.minParts) { errors.push(`Línea ${record.line}: formato inválido`); continue }

    const row = layout.unpack(parts)
    if (!row) { errors.push(`Línea ${record.line}: valor de completado inválido`); continue }
    if (isNaN(row.weightKg) || isNaN(row.reps)) {
      errors.push(`Línea ${record.line}: peso o reps inválidos`)
      continue
    }

    rows.push(row)
  }

  return buildParsedImport(layout.source, rows, errors, resolver)
}

// Layout común de 5/6 columnas: date, exercise, weight, reps[, sets], completed.
// El setNumber del archivo se ignora: se renumera 1..n al agrupar por ejercicio.
const weightRepsLayout = (source: ParsedImport['source'], hasSets = false): RowLayout => ({
  source,
  minParts: hasSets ? 6 : 5,
  unpack: (parts) => {
    const completed = parseCompleted(parts[hasSets ? 5 : 4])
    if (completed === null) return null
    return {
      date: parts[0] ?? '',
      exercise: parts[1] ?? '',
      weightKg: parseCsvWeight(parts[2]),
      reps: parseInt(parts[3] ?? '', 10),
      completed,
    }
  },
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
    discardedSets: 0,
  }
}
