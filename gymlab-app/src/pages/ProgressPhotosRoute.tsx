import { useAchievementsData } from '@/hooks/useAchievementsData'
import { useProgressPhotos } from '@/hooks/useProgressPhotos'
import { track } from '@/lib/telemetry'
import { ProgressPhotosPage } from './ProgressPhotosPage'

export const ProgressPhotosRoute = () => {
  // F120/PH-2: las fotos ya vienen del proveedor único (misma query, sin doble getAll).
  const { photos } = useAchievementsData()
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
