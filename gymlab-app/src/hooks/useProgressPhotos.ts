import { useLiveQuery } from 'dexie-react-hooks'
import { progressPhotoRepo } from '@/data/repositories'

export const useProgressPhotos = () => {
  const photos = useLiveQuery(() => progressPhotoRepo.getAll(), []) ?? []
  return { photos, progressPhotoRepo }
}
