import { useAchievementsData } from '@/hooks/useAchievementsData'
import { ProgressPhotosComparePage } from './ProgressPhotosComparePage'

export const ProgressPhotosCompareRoute = () => {
  // F120/PH-2: comparar solo lee; las fotos salen del proveedor único.
  const { photos } = useAchievementsData()
  return <ProgressPhotosComparePage photos={photos} />
}
