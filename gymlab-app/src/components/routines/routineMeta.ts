// Metadatos visuales de rutinas: icono, color y portada.
import { Dumbbell, Flame, Zap, Target, Trophy } from 'lucide-react'
import { isSafeRoutineCover } from '@/domain/safeAssetUrl'
import type { Objective, Routine } from '@/domain/types'

// Portada de la rutina. Las propias no tienen foto: toman una prestada del catálogo
// de forma estable por id, para que el detalle y la tarjeta muestren la misma imagen.
// Una URL restaurada por backup no puede ganarle al contrato local: si no es un
// asset empaquetado, se usa el fallback.
export const routineCover = (routine: Routine, fallbackImages: string[]): string => {
  if (isSafeRoutineCover(routine.imageUrl)) return routine.imageUrl
  if (fallbackImages.length === 0) return '/images/routines/default.jpg'
  const fallback = fallbackImages[routine.id % fallbackImages.length]
  if (isSafeRoutineCover(fallback)) return fallback
  return fallbackImages.find(isSafeRoutineCover) ?? '/images/routines/default.jpg'
}

// Icono lucide representativo de cada objetivo de entrenamiento.
export const OBJECTIVE_ICONS: Record<Objective, typeof Flame> = {
  volumen: Dumbbell,
  definicion: Flame,
  fuerza: Zap,
  resistencia: Target,
  general: Trophy,
}

// Clase de color del tema para resaltar cada objetivo en tarjetas y listados.
export const OBJECTIVE_COLORS: Record<Objective, string> = {
  volumen: 'text-accent',
  definicion: 'text-cta',
  fuerza: 'text-success',
  resistencia: 'text-info',
  general: 'text-muted',
}
