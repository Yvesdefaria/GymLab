// Exporta fotos (data URL base64) a la galería del teléfono.
// Nativo: plugin Media (álbum "GymLab" en Android; en iOS permiso add-only, sin álbum).
// Web: descarga directa con <a download>.
import { Capacitor } from '@capacitor/core'
import { Media } from '@capacitor-community/media'
import { logger } from '@/lib/logger'

export interface GalleryPhoto {
  dataUrl: string
  fileName: string
}

// Álbum propio en Android (el plugin lo exige); en iOS no hace falta.
const ensureGymLabAlbum = async (): Promise<string | undefined> => {
  if (Capacitor.getPlatform() !== 'android') return undefined
  const { albums } = await Media.getAlbums()
  const existing = albums.find((a) => a.name === 'GymLab')
  if (existing) return existing.identifier
  await Media.createAlbum({ name: 'GymLab' })
  const { albums: after } = await Media.getAlbums()
  return after.find((a) => a.name === 'GymLab')?.identifier
}

const downloadOnWeb = (photo: GalleryPhoto) => {
  const a = document.createElement('a')
  a.href = photo.dataUrl
  a.download = `${photo.fileName}.jpg`
  a.click()
}

// El sink solo acepta lo que producen la cámara y el canvas: data URL de imagen.
// Un backup restaurado puede poner cualquier string en frontUri/sideUri/backUri,
// y el plugin nativo abriría una ruta local; acá se corta antes de llegar.
const ALLOWED_GALLERY_DATA_URL = /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/

export const isSafeGallerySource = (value: string): boolean =>
  ALLOWED_GALLERY_DATA_URL.test(value)

export const savePhotosToGallery = async (
  photos: GalleryPhoto[],
): Promise<{ saved: number; failed: number }> => {
  const safePhotos = photos.filter((photo) => isSafeGallerySource(photo.dataUrl))
  const rejected = photos.length - safePhotos.length
  if (safePhotos.length === 0) return { saved: 0, failed: rejected }
  if (!Capacitor.isNativePlatform()) {
    safePhotos.forEach(downloadOnWeb)
    return { saved: safePhotos.length, failed: rejected }
  }
  const albumIdentifier = await ensureGymLabAlbum()
  let saved = 0
  let failed = rejected
  for (const photo of safePhotos) {
    try {
      await Media.savePhoto({ path: photo.dataUrl, albumIdentifier, fileName: photo.fileName })
      saved++
    } catch (error) {
      logger.warn('gallery', 'no se pudo guardar la foto', { error })
      failed++
    }
  }
  return { saved, failed }
}
