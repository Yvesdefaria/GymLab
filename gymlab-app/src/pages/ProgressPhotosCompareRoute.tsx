import { useProgressPhotoList } from '@/hooks/useProgressPhotos'
import { useAchievementsData } from '@/hooks/useAchievementsData'
import { ProgressPhotosComparePage } from './ProgressPhotosComparePage'

export const ProgressPhotosCompareRoute = () => {
  // F120/PH-1: comparar lee la lista completa con el hook compartido (el proveedor
  // global ya no materializa las fotos). El peso sale de la capa única para el delta A/B.
  const photos = useProgressPhotoList()
  const { bodyWeights } = useAchievementsData()
  return <ProgressPhotosComparePage photos={photos} bodyWeights={bodyWeights} />
}
