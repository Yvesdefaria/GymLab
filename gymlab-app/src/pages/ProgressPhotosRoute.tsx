import { useProgressPhotos } from '@/hooks/useProgressPhotos'
import { track } from '@/lib/telemetry'
import { ProgressPhotosPage } from './ProgressPhotosPage'

export const ProgressPhotosRoute = () => {
  const { photos, progressPhotoRepo } = useProgressPhotos()
  return (
    <ProgressPhotosPage
      photos={photos}
      onAdd={(p) => {
        void progressPhotoRepo.upsert(p)
        track('photo_added', {})
      }}
      onDelete={(id) => progressPhotoRepo.delete(id)}
    />
  )
}
