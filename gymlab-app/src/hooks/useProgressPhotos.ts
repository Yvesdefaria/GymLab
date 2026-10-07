import { progressPhotoRepo } from '@/data/repositories'
import { useLiveList } from './useLiveList'
import type { ProgressPhotoEntry } from '@/domain/types'

// F120/PH-1: el proveedor global solo cuenta fotos (count indexado); la lista completa
// —data URLs incluidas— se materializa únicamente en las rutas que la renderizan
// (/progreso-fotos y /progreso-fotos/comparar) a través de este hook compartido.
export const useProgressPhotoList = (): ProgressPhotoEntry[] =>
  useLiveList(() => progressPhotoRepo.getAll())

// Punto de acceso a las mutaciones de fotos, sin liveQuery propia.
export const useProgressPhotos = () => ({ progressPhotoRepo })
