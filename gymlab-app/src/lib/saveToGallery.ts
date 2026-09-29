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

export const savePhotosToGallery = async (
  photos: GalleryPhoto[],
): Promise<{ saved: number; failed: number }> => {
  if (!Capacitor.isNativePlatform()) {
    photos.forEach(downloadOnWeb)
    return { saved: photos.length, failed: 0 }
  }
  const albumIdentifier = await ensureGymLabAlbum()
  let saved = 0
  let failed = 0
  for (const photo of photos) {
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
