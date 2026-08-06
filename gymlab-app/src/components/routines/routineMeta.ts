import { Dumbbell, Flame, Zap, Target, Trophy } from 'lucide-react'
import type { Objective } from '@/domain/types'

export const OBJECTIVE_ICONS: Record<Objective, typeof Flame> = {
  volumen: Dumbbell,
  definicion: Flame,
  fuerza: Zap,
  resistencia: Target,
  general: Trophy,
}

export const OBJECTIVE_COLORS: Record<Objective, string> = {
  volumen: 'text-accent',
  definicion: 'text-cta',
  fuerza: 'text-success',
  resistencia: 'text-info',
  general: 'text-muted',
}
