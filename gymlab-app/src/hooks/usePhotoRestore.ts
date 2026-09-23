// Recupera la foto si Android mató la app con la cámara abierta (appRestoredResult).
import { useEffect } from 'react'
import { App } from '@capacitor/app'
import {
  clearPendingPhotoAngle,
  getPendingPhotoAngle,
  resizeImageToDataUrl,
} from '@/lib/photoCapture'
import { progressPhotoRepo } from '@/data/repositories'

type RestoredResult = {
  pluginId?: string
  success?: boolean
  data?: { webPath?: string }
}

export const usePhotoRestore = () => {
  useEffect(() => {
    const listener = App.addListener('appRestoredResult', (result) => {
      void (async () => {
        const data = result as unknown as RestoredResult
        const angle = getPendingPhotoAngle()
        if (data.pluginId !== 'Camera' || !data.success || !data.data?.webPath || !angle) return
        clearPendingPhotoAngle()
        try {
          const dataUrl = await resizeImageToDataUrl(data.data.webPath, 800)
          const today = new Date().toISOString().slice(0, 10)
          const existing = await progressPhotoRepo.getByDate(today)
          await progressPhotoRepo.upsert(
            existing
              ? { ...existing, [angle]: dataUrl }
              : { localDate: today, frontUri: null, sideUri: null, backUri: null, [angle]: dataUrl },
          )
        } catch {
          // La foto restaurada no se pudo procesar: se descarta en silencio.
        }
      })()
    })
    return () => {
      void listener.then((l) => l.remove())
    }
  }, [])
}
