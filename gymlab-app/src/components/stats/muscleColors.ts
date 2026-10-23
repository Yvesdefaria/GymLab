// Mapa único grupo muscular → color categórico de datos. El verde no participa:
// queda reservado a meta/PR/cumplido.
import type { DataColors } from '@/hooks/useDataColors'
import type { MuscleGroup } from '@/domain/types'

export const muscleColor = (muscle: MuscleGroup, colors: DataColors): string => {
  switch (muscle) {
    case 'pecho':
      return colors.chest
    case 'espalda':
    case 'trapecios':
      return colors.back
    case 'biceps':
    case 'triceps':
    case 'antebrazo':
      return colors.arms
    case 'hombro':
      return colors.shoulders
    case 'pierna':
    case 'gluteo':
      return colors.legs
    case 'abdomen':
      return colors.core
    default:
      return colors.rest
  }
}
