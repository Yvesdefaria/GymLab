// Fotos de progreso: captura de fotos corporales (frente/lateral/espalda) por fecha.
import { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Trash2, ArrowLeftRight, Camera, ImageDown } from 'lucide-react'
import type { ProgressPhotoEntry } from '@/domain/types'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { PhotoSourceSheet } from '@/components/photos/PhotoSourceSheet'
import { usePagedList } from '@/hooks/usePagedList'
import { savePhotosToGallery } from '@/lib/saveToGallery'
import {
  capturePhoto,
  clearPendingPhotoAngle,
  isNativePlatform,
  readFileAsDataUrl,
  resizeImageToDataUrl,
  setPendingPhotoAngle,
  type PhotoAngle,
  type PhotoSource,
} from '@/lib/photoCapture'

interface ProgressPhotosPageProps {
  photos: ProgressPhotoEntry[]
  onAdd: (photo: Omit<ProgressPhotoEntry, 'id' | 'createdAt'>) => void
  onDelete: (id: number) => void
}

// F120/PH-3: el timeline pagina de a 10 fechas (hasta 30 <img> full-res) en vez de
// montar cientos de imágenes decodificadas de una sola vez.
const PHOTO_PAGE_SIZE = 10

export const ProgressPhotosPage = ({ photos, onAdd, onDelete }: ProgressPhotosPageProps) => {
  const { t } = useTranslation()
  const frontRef = useRef<HTMLInputElement>(null)
  const sideRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)
  const [sheetAngle, setSheetAngle] = useState<PhotoAngle | null>(null)
  const [captureError, setCaptureError] = useState(false)
  const [savingDate, setSavingDate] = useState<string | null>(null)
  const [galleryToast, setGalleryToast] = useState<'ok' | 'error' | null>(null)

  // El toast de guardado se oculta solo a los 2,5 s (sin interacción del usuario).
  useEffect(() => {
    if (!galleryToast) return
    const id = setTimeout(() => setGalleryToast(null), 2500)
    return () => clearTimeout(id)
  }, [galleryToast])

  // Timeline: orden estable por fecha (más reciente primero) y paginado «Ver más».
  const sorted = useMemo(
    () => [...photos].sort((a, b) => b.localDate.localeCompare(a.localDate)),
    [photos]
  )
  const { visible, hasMore, showMore } = usePagedList(sorted, PHOTO_PAGE_SIZE)

  const savePhoto = async (angle: PhotoAngle, dataUrl: string) => {
    const today = new Date().toISOString().slice(0, 10)
    const existing = photos.find((p) => p.localDate === today)
    if (existing) onAdd({ ...existing, [angle]: dataUrl })
    else onAdd({ localDate: today, frontUri: null, sideUri: null, backUri: null, [angle]: dataUrl })
  }

  const handleWebFile = async (angle: PhotoAngle, file: File) => {
    const src = await readFileAsDataUrl(file)
    await savePhoto(angle, await resizeImageToDataUrl(src, 800))
  }

  const handleAngleClick = (angle: PhotoAngle) => {
    if (isNativePlatform()) {
      setSheetAngle(angle)
      return
    }
    const input = angle === 'frontUri' ? frontRef : angle === 'sideUri' ? sideRef : backRef
    input.current?.click()
  }

  const handleSheetSelect = async (source: PhotoSource) => {
    const angle = sheetAngle
    setSheetAngle(null)
    if (!angle) return
    setCaptureError(false)
    try {
      setPendingPhotoAngle(angle)
      const webPath = await capturePhoto(source)
      if (!webPath) return
      await savePhoto(angle, await resizeImageToDataUrl(webPath, 800))
    } catch {
      setCaptureError(true)
    } finally {
      clearPendingPhotoAngle()
    }
  }

  // Exporta a la galería las fotos presentes de una fecha (web: descarga cada una).
  const handleSaveToGallery = async (entry: ProgressPhotoEntry) => {
    const items = (['frontUri', 'sideUri', 'backUri'] as const)
      .filter((a) => entry[a])
      .map((a) => ({
        dataUrl: entry[a]!,
        fileName: `gymlab-${entry.localDate}-${a.replace('Uri', '').toLowerCase()}`,
      }))
    if (items.length === 0) return
    setSavingDate(entry.localDate)
    try {
      const { failed } = await savePhotosToGallery(items)
      setGalleryToast(failed === 0 ? 'ok' : 'error')
    } catch {
      setGalleryToast('error')
    } finally {
      setSavingDate(null)
    }
  }

  return (
    <div>
      <AppHeader title={t('progressPhotos.title')} />
      <div className="flex flex-col gap-4 px-4 pb-20 pt-2">
        <BackLink to="/mas" />
        <div className="flex items-center justify-end">
          <Link
            to="/progreso-fotos/comparar"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-accent/10 px-3 py-2 text-sm font-medium text-accent"
          >
            <ArrowLeftRight className="size-4" /> {t('progressPhotos.compare')}
          </Link>
        </div>

      {/* Captura de fotos */}
      <div className="rounded-2xl border border-border/30 bg-bg-elevated/30 p-4">
        <p className="mb-3 text-sm font-semibold text-fg">{t('progressPhotos.capture')}</p>
        <div className="flex gap-3">
          {(['frontUri', 'sideUri', 'backUri'] as const).map((angle) => (
            <button
              key={angle}
              onClick={() => handleAngleClick(angle)}
              className="flex min-h-[44px] flex-1 flex-col items-center gap-1.5 rounded-xl border border-border/30 bg-bg-elevated/50 px-2 py-3"
            >
              <Camera className="size-4 text-muted" />
              <span className="text-xs text-muted">
                {t(`progressPhotos.${angle}`)}
              </span>
            </button>
          ))}
        </div>
        <input
          ref={frontRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleWebFile('frontUri', f)
          }}
        />
        <input
          ref={sideRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleWebFile('sideUri', f)
          }}
        />
        <input
          ref={backRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleWebFile('backUri', f)
          }}
        />
        {captureError && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {t('progressPhotos.captureError')}
          </p>
        )}
      </div>

      {/* Timeline */}
      <div className="flex flex-col gap-3">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted">{t('progressPhotos.empty')}</p>
        ) : (
          visible.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border/30 bg-bg-elevated/30 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-fg">{p.localDate}</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => void handleSaveToGallery(p)}
                    disabled={savingDate === p.localDate}
                    aria-label={t('progressPhotos.saveToGallery')}
                    className="inline-flex size-11 items-center justify-center rounded-xl text-muted hover:text-accent disabled:opacity-50"
                  >
                    <ImageDown className="size-4" />
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="inline-flex size-11 items-center justify-center rounded-xl text-muted hover:text-red-400"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <div className="flex gap-1.5">
                {(['frontUri', 'sideUri', 'backUri'] as const).map((angle) => (
                  <div key={angle} className="flex flex-col items-center gap-1">
                    {p[angle] ? <img src={p[angle]!} className="h-20 flex-1 rounded-xl object-cover" alt="" loading="lazy" /> : <div className="h-20 flex-1 rounded-xl bg-bg-elevated/50" />}
                    <span className="text-xs text-muted">{t(`progressPhotos.${angle}`)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        {hasMore && (
          <Button size="sm" variant="ghost" className="w-full" onClick={showMore}>
            {t('progressPhotos.verMas')}
          </Button>
        )}
      </div>

      {galleryToast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[120] -translate-x-1/2 rounded-xl border border-border/30 bg-bg-elevated px-4 py-2 text-sm text-fg shadow-lg"
        >
          {galleryToast === 'ok' ? t('progressPhotos.savedToGallery') : t('progressPhotos.saveError')}
        </div>
      )}

      {sheetAngle && (
        <PhotoSourceSheet onSelect={handleSheetSelect} onClose={() => setSheetAngle(null)} />
      )}
    </div>
  </div>
  )
}
