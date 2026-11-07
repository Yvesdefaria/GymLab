// Parsers de importación de datos desde otras apps (Strong, Hevy, JEFIT).
import type { Workout, WorkoutSet } from './types'
import { parseDecimal } from './numberGuard'

// La fecha del CSV es el único campo que se persiste sin pasar por un número y
// después se reusa en un nombre de archivo: se normaliza a ISO y se rechaza lo
// que no representa un día real. Se acepta una hora opcional (`T10:30` o
// ` 10:30`) porque algunos exports la incluyen; los separadores deben coincidir.
const ISO_IMPORT_DATE = /^(\d{4})([-/])(\d{1,2})\2(\d{1,2})$/
const US_IMPORT_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
const DATE_ONLY = /^[^T\s]+/

const toIsoDate = (year: number, month: number, day: number): string | null => {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(Date.UTC(year, month - 1, day))
  const valid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  if (!valid) return null
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Acepta YYYY-MM-DD, YYYY/MM/DD y MM/DD/YYYY (formato de export US), con una
// hora opcional que se descarta.
export const normalizeImportDate = (value: string): string | null => {
  const dateOnly = DATE_ONLY.exec(value.trim())?.[0] ?? ''
  const iso = ISO_IMPORT_DATE.exec(dateOnly)
  if (iso) return toIsoDate(Number(iso[1]), Number(iso[3]), Number(iso[4]))
  const us = US_IMPORT_DATE.exec(dateOnly)
  if (us) return toIsoDate(Number(us[3]), Number(us[1]), Number(us[2]))
  return null
}

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
  // Línea física donde empieza el registro que quedó abierto (solo si unterminatedQuote).
  brokenLine?: number
}

// Separa el CSV completo en registros respetando comillas: una coma dentro de
// comillas no separa columnas, `""` es una comilla escapada y un salto de línea
// dentro de comillas pertenece al campo (F139.11). Devuelve la línea física de
// cada registro y marca si el archivo termina dentro de comillas (F140.4).
const parseCsvRecords = (csv: string, firstLine = 1): CsvParse => {
  const records: CsvRecord[] = []
  let fields: string[] = []
  let field = ''
  let quoted = false
  let line = firstLine
  let startLine = firstLine

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

  if (quoted) return { records, unterminatedQuote: true, brokenLine: startLine }
  if (field !== '' || fields.length > 0) {
    fields.push(field.trim())
    records.push({ fields, line: startLine })
  }
  return { records, unterminatedQuote: false }
}

// Recorta las líneas en blanco iniciales conservando la línea física del primer
// registro (un preámbulo vacío no debe desplazar los números de línea).
const stripLeadingBlankLines = (csv: string): { source: string; firstLine: number } => {
  const preamble = csv.match(/^(?:[^\S\r\n]*\r?\n)+/)?.[0] ?? ''
  const firstLine = preamble === '' ? 1 : (preamble.match(/\n/g)?.length ?? 0) + 1
  return { source: csv.slice(preamble.length).trimEnd(), firstLine }
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

const splitCsvLines = (csv: string, firstLine = 1): CsvRecord[] =>
  csv.split(/\r?\n/).map((text, i) => ({ fields: splitCsvLine(text), line: firstLine + i }))

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
  const { source, firstLine } = stripLeadingBlankLines(csv)
  const parsed = parseCsvRecords(source, firstLine)
  const errors: string[] = []
  const rows: RawRow[] = []

  let records = parsed.records
  if (parsed.unterminatedQuote) {
    errors.push('CSV con comillas sin cerrar; se recuperó línea por línea')
    // Conserva los registros completos previos a la comilla rota (con sus campos
    // multilínea) y re-parsea línea por línea solo el tramo roto en adelante.
    const brokenLine = parsed.brokenLine ?? firstLine
    const rest = source.split(/\r?\n/).slice(brokenLine - firstLine).join('\n')
    records = [...parsed.records, ...splitCsvLines(rest, brokenLine)]
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
    const date = normalizeImportDate(row.date)
    if (!date) { errors.push(`Línea ${record.line}: fecha inválida`); continue }
    row.date = date
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
