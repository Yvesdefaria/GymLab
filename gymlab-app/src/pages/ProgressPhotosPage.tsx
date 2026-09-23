// Fotos de progreso: captura de fotos corporales (frente/lateral/espalda) por fecha.
import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, ArrowLeftRight, Camera } from 'lucide-react'
import type { ProgressPhotoEntry } from '@/domain/types'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { PhotoSourceSheet } from '@/components/photos/PhotoSourceSheet'
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
  const [compareMode, setCompareMode] = useState(false)
  const [dateA, setDateA] = useState('')
  const [dateB, setDateB] = useState('')
  const frontRef = useRef<HTMLInputElement>(null)
  const sideRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)
  const [sheetAngle, setSheetAngle] = useState<PhotoAngle | null>(null)
  const [captureError, setCaptureError] = useState(false)

  const sorted = [...photos].sort((a, b) => b.localDate.localeCompare(a.localDate))
  const dates = [...new Set(photos.map((p) => p.localDate))].sort().reverse()

  const photoA = photos.find((p) => p.localDate === dateA)
  const photoB = photos.find((p) => p.localDate === dateB)

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

  return (
    <div>
      <AppHeader title={t('progressPhotos.title')} />
      <div className="flex flex-col gap-4 px-4 pb-20 pt-2">
        <BackLink to="/mas" />
        <div className="flex items-center justify-end">
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium ${
              compareMode ? 'bg-accent text-accent-fg' : 'bg-accent/10 text-accent'
            }`}
          >
            <ArrowLeftRight className="size-4" /> {t('progressPhotos.compare')}
          </button>
        </div>

      {/* Captura de fotos */}
      {!compareMode && (
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
      )}

      {/* Comparador */}
      {compareMode && (
        <div className="rounded-2xl border border-border/30 bg-bg-elevated/30 p-4">
          <p className="mb-3 text-sm font-semibold text-fg">{t('progressPhotos.selectDates')}</p>
          <div className="flex gap-3 mb-3">
            <select value={dateA} onChange={(e) => setDateA(e.target.value)} className="flex-1 min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/50 px-3 py-2 text-sm text-fg">
              <option value="">{t('progressPhotos.dateA')}</option>
              {dates.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={dateB} onChange={(e) => setDateB(e.target.value)} className="flex-1 min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/50 px-3 py-2 text-sm text-fg">
              <option value="">{t('progressPhotos.dateB')}</option>
              {dates.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {(photoA || photoB) && (
            <div className="grid grid-cols-2 gap-3">
              {(['frontUri', 'sideUri', 'backUri'] as const).map((angle) => (
                <div key={angle} className="flex flex-col gap-1.5">
                  <p className="text-xs text-muted text-center">{t(`progressPhotos.${angle}`)}</p>
                  <div className="flex gap-1.5">
                    {photoA?.[angle] ? <img src={photoA[angle]!} className="h-24 flex-1 rounded-xl object-cover" alt="" loading="lazy" /> : <div className="h-24 flex-1 rounded-xl bg-bg-elevated/50" />}
                    {photoB?.[angle] ? <img src={photoB[angle]!} className="h-24 flex-1 rounded-xl object-cover" alt="" loading="lazy" /> : <div className="h-24 flex-1 rounded-xl bg-bg-elevated/50" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="flex flex-col gap-3">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted">{t('progressPhotos.empty')}</p>
        ) : (
          sorted.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border/30 bg-bg-elevated/30 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-fg">{p.localDate}</p>
                <button
                  onClick={() => onDelete(p.id)}
                  className="inline-flex size-11 items-center justify-center rounded-xl text-muted hover:text-red-400"
                >
                  <Trash2 className="size-4" />
                </button>
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
      </div>

      {sheetAngle && (
        <PhotoSourceSheet onSelect={handleSheetSelect} onClose={() => setSheetAngle(null)} />
      )}
    </div>
  </div>
  )
}
