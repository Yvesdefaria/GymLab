import { progressPhotoRepo } from '@/data/repositories'
import { sanitizeProgressPhotoEntry } from '@/domain/safeAssetUrl'
import { useLiveList } from './useLiveList'
import type { ProgressPhotoEntry } from '@/domain/types'

// F120/PH-1: el proveedor global solo cuenta fotos (count indexado); la lista completa
// —data URLs incluidas— se materializa únicamente en las rutas que la renderizan
// (/progreso-fotos y /progreso-fotos/comparar) a través de este hook compartido.
// Las URIs que no son data:image/* (p. ej. restauradas por backup) se nulifican acá,
// antes de cualquier render o guardado.
export const useProgressPhotoList = (): ProgressPhotoEntry[] =>
  useLiveList(async () =>
    (await progressPhotoRepo.getAll()).map(sanitizeProgressPhotoEntry),
  )

// Punto de acceso a las mutaciones de fotos, sin liveQuery propia.
export const useProgressPhotos = () => ({ progressPhotoRepo })
