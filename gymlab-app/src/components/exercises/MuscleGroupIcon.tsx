// Iconos lucide asociados a cada grupo muscular del catálogo.
import {
  BicepsFlexed,
  Dumbbell,
  Footprints,
  Heart,
  HeartPulse,
  PersonStanding,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { MuscleGroup } from '@/domain/types'

// Mapa grupo muscular -> icono (varios grupos comparten icono por similitud).
const MUSCLE_GROUP_ICONS: Record<MuscleGroup, LucideIcon> = {
  pecho: HeartPulse,
  espalda: PersonStanding,
  biceps: BicepsFlexed,
  triceps: BicepsFlexed,
  hombro: Dumbbell,
  pierna: Footprints,
  gluteo: Footprints,
  abdomen: Zap,
  trapecios: PersonStanding,
  antebrazo: BicepsFlexed,
  cardio: Heart,
}

// Renderiza el icono del grupo; decorativo, por eso se oculta del árbol de accesibilidad.
export const MuscleGroupIcon = ({
  group,
  className,
}: {
  group: MuscleGroup
  className?: string
}) => {
  const Icon = MUSCLE_GROUP_ICONS[group]
  return <Icon className={className} aria-hidden />
}
