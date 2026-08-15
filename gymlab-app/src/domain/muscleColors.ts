// Colores por nivel de fatiga para el maniquí 3D: escala de calor (verde → ámbar → naranja → rojo).
// El SVG usa clases Tailwind (fatigueColorClass); los materiales de Three.js necesitan colores exactos.
import type { FatigueLevel } from './types'

export const FATIGUE_HEAT_COLORS: Record<FatigueLevel, string> = {
  fresh: '#22c55e',
  warm: '#f59e0b',
  fatigued: '#f97316',
  sore: '#ef4444',
}

// Color de los grupos sin datos (gris neutro), distinto de «recuperado» para no confundir la escala.
export const MUSCLE_NO_DATA_COLOR = '#3a352b'

// Color de piel/conexiones del maniquí (cabeza, torso base, manos, pies).
export const MUSCLE_BASE_COLOR = '#242422'

// Color de resaltado/selección (dorado claro del tema GymLab).
export const MUSCLE_HIGHLIGHT_COLOR = '#fdddb4'

// Resuelve el color hex de un grupo: escala de calor si hay nivel, o gris «sin datos».
export const fatigueToColor = (level: FatigueLevel | undefined): string =>
  level ? FATIGUE_HEAT_COLORS[level] : MUSCLE_NO_DATA_COLOR
