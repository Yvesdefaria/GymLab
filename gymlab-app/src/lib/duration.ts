// Helpers puros de duración (segundos ↔ texto) compartidos por la sesión y el detalle read-only.
// F96 D1: un único formateador con modos para todos los timers; el modo por
// defecto (`clock`) conserva intacta la salida que ya consumen el resto de vistas.

// Modo de salida de `formatDuration`:
// - 'clock'   → "m:ss" / "h:mm:ss" (histórico; sin rellenar el campo de minutos)
// - 'mm:ss'   → "mm:ss", acumulando las horas en minutos ("60:00")
// - 'seconds' → total de segundos como número plano ("65")
export type TimeFormat = 'clock' | 'mm:ss' | 'seconds'

// Formatea segundos al modo indicado.
export const formatDuration = (seconds: number, format: TimeFormat = 'clock'): string => {
  if (format === 'seconds') return String(seconds)

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const ss = String(s).padStart(2, '0')

  if (format === 'mm:ss') {
    // Las horas se suman a los minutos para no añadir un tercer campo.
    return `${String(h * 60 + m).padStart(2, '0')}:${ss}`
  }
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`
  return `${m}:${ss}`
}

// Parsea entrada de duración a segundos.
// Acepta: "5" → 5 min, "5:30" → 5m30s, "1:05:30" → 1h5m30s.
export const parseDuration = (str: string): number => {
  const trimmed = str.trim()
  if (trimmed === '') return 0
  const parts = trimmed.split(':').map(Number)
  if (parts.some(isNaN)) return 0
  if (parts.length === 3) return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0)
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
  // Número suelto → minutos (input más común en cardio: "5" = 5 min)
  return (parts[0] ?? 0) * 60
}
