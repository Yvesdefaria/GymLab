// Helpers puros de duración (segundos ↔ texto) compartidos por la sesión y el detalle read-only.

// Formatea segundos a MM:SS o HH:MM:SS.
export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
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