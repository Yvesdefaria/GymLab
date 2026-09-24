import { useProgressPhotos } from '@/hooks/useProgressPhotos'
import { ProgressPhotosComparePage } from './ProgressPhotosComparePage'

export const ProgressPhotosCompareRoute = () => {
  const { photos } = useProgressPhotos()
  return <ProgressPhotosComparePage photos={photos} />
}
