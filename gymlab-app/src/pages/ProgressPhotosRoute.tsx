import { useProgressPhotos } from '@/hooks/useProgressPhotos'
import { ProgressPhotosPage } from './ProgressPhotosPage'

export const ProgressPhotosRoute = () => {
  const { photos, progressPhotoRepo } = useProgressPhotos()
  return (
    <ProgressPhotosPage
      photos={photos}
      onAdd={(p) => progressPhotoRepo.upsert(p)}
      onDelete={(id) => progressPhotoRepo.delete(id)}
    />
  )
}
