import { useProgressPhotoList } from '@/hooks/useProgressPhotos'
import { ProgressPhotosComparePage } from './ProgressPhotosComparePage'

export const ProgressPhotosCompareRoute = () => {
  // F120/PH-1: comparar lee la lista completa con el hook compartido (el proveedor
  // global ya no materializa las fotos).
  const photos = useProgressPhotoList()
  return <ProgressPhotosComparePage photos={photos} />
}
