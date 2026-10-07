import { useProgressPhotoList, useProgressPhotos } from '@/hooks/useProgressPhotos'
import { track } from '@/lib/telemetry'
import { ProgressPhotosPage } from './ProgressPhotosPage'

export const ProgressPhotosRoute = () => {
  // F120/PH-1: la lista completa se lee solo acá (el proveedor global no la materializa).
  const photos = useProgressPhotoList()
  const { progressPhotoRepo } = useProgressPhotos()
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
