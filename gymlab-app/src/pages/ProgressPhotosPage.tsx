// Fotos de progreso (F132.5): última sesión como héroe, captura en tres slots,
// timeline hairline y sheet por fecha. Conserva la captura web/nativa, el guardado
// en galería y el borrado; el héroe y las filas son la nueva capa visual.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ArrowLeftRight, Camera } from 'lucide-react'
import type { ProgressPhotoEntry } from '@/domain/types'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { PhotoSourceSheet } from '@/components/photos/PhotoSourceSheet'
import { PhotoDateSheet } from '@/components/photos/PhotoDateSheet'
import { ProgressPhotosCapture } from '@/components/photos/ProgressPhotosCapture'
import { ProgressPhotosHero } from '@/components/photos/ProgressPhotosHero'
import { ProgressPhotosTimeline } from '@/components/photos/ProgressPhotosTimeline'
import { countPhotoAngles, sortPhotosByDateDesc } from '@/domain/bodyProgress'
import { toLocalDateStr } from '@/domain/dates'
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

export const ProgressPhotosPage = ({ photos, onAdd, onDelete }: ProgressPhotosPageProps) => {
  const { t } = useTranslation()
  const frontRef = useRef<HTMLInputElement>(null)
  const sideRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)
  const [sheetAngle, setSheetAngle] = useState<PhotoAngle | null>(null)
  const [sheetEntry, setSheetEntry] = useState<ProgressPhotoEntry | null>(null)
  const [captureError, setCaptureError] = useState(false)
  const [savingDate, setSavingDate] = useState<string | null>(null)
  const [galleryToast, setGalleryToast] = useState<'ok' | 'error' | null>(null)

  const today = toLocalDateStr()
  const sorted = useMemo(() => sortPhotosByDateDesc(photos), [photos])
  const latest = sorted[0] ?? null
  const todayEntry = useMemo(
    () => photos.find((p) => p.localDate === today) ?? null,
    [photos, today],
  )
  const photoTotal = useMemo(
    () => sorted.reduce((sum, p) => sum + countPhotoAngles(p), 0),
    [sorted],
  )

  // El toast de guardado se oculta solo a los 2,5 s (sin interacción del usuario).
  useEffect(() => {
    if (!galleryToast) return
    const id = setTimeout(() => setGalleryToast(null), 2500)
    return () => clearTimeout(id)
  }, [galleryToast])

  const savePhoto = async (angle: PhotoAngle, dataUrl: string) => {
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

  const handleDelete = (entry: ProgressPhotoEntry) => {
    onDelete(entry.id)
    setSheetEntry(null)
  }

  return (
    <div>
      <AppHeader
        kicker={t('progressPhotos.kicker')}
        title={t('progressPhotos.title')}
        actions={
          <Link
            to="/progreso-fotos/comparar"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-[11px] font-semibold text-gold"
          >
            <ArrowLeftRight className="size-4" aria-hidden />
            {t('progressPhotos.compare')}
          </Link>
        }
      />

      <div className="px-4 pb-24">
        <BackLink to="/mas" />

        {latest ? (
          <ProgressPhotosHero
            entry={latest}
            photoCount={photoTotal}
            dateCount={sorted.length}
            onOpen={() => setSheetEntry(latest)}
          />
        ) : (
          <EmptyState
            icon={<Camera className="size-6" aria-hidden />}
            title={t('progressPhotos.emptyTitle')}
            message={t('progressPhotos.empty')}
            size="lg"
          />
        )}

        <div className="mt-4">
          <ProgressPhotosCapture todayEntry={todayEntry} onSelect={handleAngleClick} />
          {captureError && (
            <p role="alert" className="mt-2 text-xs text-danger">
              {t('progressPhotos.captureError')}
            </p>
          )}
        </div>

        {/* Inputs ocultos de web: el primero (frente) lo usa el e2e F106.1. */}
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

        {sorted.length > 0 && (
          <div className="mt-4">
            <ProgressPhotosTimeline photos={sorted} onOpen={setSheetEntry} />
          </div>
        )}
      </div>

      {galleryToast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[120] -translate-x-1/2 rounded-xl border border-border/30 bg-bg-elevated px-4 py-2 text-sm text-fg shadow-lg"
        >
          {galleryToast === 'ok'
            ? t('progressPhotos.savedToGallery')
            : t('progressPhotos.saveError')}
        </div>
      )}

      {sheetAngle && (
        <PhotoSourceSheet onSelect={handleSheetSelect} onClose={() => setSheetAngle(null)} />
      )}

      {sheetEntry && (
        <PhotoDateSheet
          entry={sheetEntry}
          saving={savingDate === sheetEntry.localDate}
          onClose={() => setSheetEntry(null)}
          onSaveToGallery={(entry) => void handleSaveToGallery(entry)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
