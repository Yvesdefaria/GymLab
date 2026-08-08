// Metadatos visuales de rutinas: icono y color por objetivo.
import { Dumbbell, Flame, Zap, Target, Trophy } from 'lucide-react'
import type { Objective } from '@/domain/types'

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
