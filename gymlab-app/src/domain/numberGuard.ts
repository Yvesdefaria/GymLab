// Guardas numéricas para sanear entradas y evitar valores inválidos en cálculos.
// Limita un valor a [min, max]; NaN cae al mínimo para no propagar inválidos a los cálculos.
export const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) return min
  return Math.min(Math.max(value, min), max)
}

// Porcentaje 0-100 seguro: comparte la guarda de NaN de clamp (barras de
// progreso, anillos y heatmaps que recortan el % mostrado a 100).
export const clampPercent = (value: number): number => clamp(value, 0, 100)

// Resultado explícito del parser decimal: nunca se confunde un texto inválido
// con el número 0 (a diferencia de `Number('')`/`parseFloat('abc')`).
export type DecimalParse =
  | { ok: true; value: number }
  | { ok: false; error: 'empty' | 'invalid' }

// Parser decimal compartido: acepta ',' o '.' como separador, recorta espacios
// y devuelve un resultado inválido explícito para texto vacío o no numérico.
export const parseDecimal = (raw: string): DecimalParse => {
  const trimmed = raw.trim()
  if (trimmed === '') return { ok: false, error: 'empty' }
  // Solo se reemplaza el primer separador: entradas con varios ('1,2,3') quedan
  // como NaN y se rechazan en vez de interpretarse parcialmente.
  const value = Number(trimmed.replace(',', '.'))
  if (!Number.isFinite(value)) return { ok: false, error: 'invalid' }
  return { ok: true, value }
}

// Resultado de confirmar un borrador (al escribir o al pulsar Enter): escribe un
// decimal válido recortado al rango, limpia un campo vacío o ignora el texto
// inválido — nunca lo convierte en 0.
export type DraftCommit =
  | { action: 'commit'; value: number }
  | { action: 'clear' }
  | { action: 'ignore' }

export const resolveDraftCommit = (
  raw: string,
  min = -Infinity,
  max = Infinity
): DraftCommit => {
  const parsed = parseDecimal(raw)
  if (parsed.ok) return { action: 'commit', value: clamp(parsed.value, min, max) }
  return parsed.error === 'empty' ? { action: 'clear' } : { action: 'ignore' }
}

// Guarda de borrador (F102): filtra el texto carácter a carácter mientras se
// teclea, así el input nunca muestra algo que no pueda parsearse después.
export const sanitizeDecimalDraft = (
  raw: string,
  mode: 'decimal' | 'integer' | 'duration'
): string => {
  if (mode === 'integer') return raw.replace(/\D/g, '')
  if (mode === 'duration') {
    // El usuario teclea solo dígitos: se extraen todos y se formatean m:ss con
    // la regla «cola de 2 dígitos = segundos» (el ':' se inserta solo).
    const digits = raw.replace(/\D/g, '')
    if (digits === '') return ''
    if (digits.length <= 2) return `0:${digits.padStart(2, '0')}`
    // Minutos = todo menos la cola de 2; los ceros a la izquierda se descartan
    // dejando al menos un dígito ('05' → '5', '00' → '0').
    const minutes = digits.slice(0, -2).replace(/^0+/, '') || '0'
    return `${minutes}:${digits.slice(-2)}`
  }
  // 'decimal': dígitos + el PRIMER separador (',' o '.'); los posteriores se
  // descartan para que el borrador nunca quede con dos separadores.
  const filtered = raw.replace(/[^0-9.,]/g, '')
  const sepIndex = filtered.search(/[.,]/)
  if (sepIndex === -1) return filtered
  return filtered.slice(0, sepIndex + 1) + filtered.slice(sepIndex + 1).replace(/[.,]/g, '')
}

// Decisión de pintado (F102.3): combina el filtro con la confirmación para que
// el input pinte el borrador limpio y sepa si debe confirmarlo. Un borrador que
// quedó vacío por caracteres inválidos se ignora (no debe limpiar el valor
// guardado); el vacío real (el usuario borró todo) sí se confirma como clear.
export type SanitizedDraft = { draft: string; shouldCommit: boolean }

export const resolveSanitizedDraft = (
  raw: string,
  mode: 'decimal' | 'integer' = 'decimal'
): SanitizedDraft => {
  const draft = sanitizeDecimalDraft(raw, mode)
  return { draft, shouldCommit: draft !== '' || raw === '' }
}
