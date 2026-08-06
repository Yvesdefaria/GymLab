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

export const MUSCLE_GROUP_ICONS: Record<MuscleGroup, LucideIcon> = {
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
