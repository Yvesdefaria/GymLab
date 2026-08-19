// Fotos de progreso: captura de fotos corporales (frente/lateral/espalda) por fecha.
import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Trash2, ArrowLeftRight } from 'lucide-react'
import type { ProgressPhotoEntry } from '@/domain/types'

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

  const sorted = [...photos].sort((a, b) => b.localDate.localeCompare(a.localDate))
  const dates = [...new Set(photos.map((p) => p.localDate))].sort().reverse()

  const photoA = photos.find((p) => p.localDate === dateA)
  const photoB = photos.find((p) => p.localDate === dateB)

  const resizeImage = (file: File, maxPx = 800): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image()
      const reader = new FileReader()
      reader.onload = () => {
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
          canvas.width = img.width * ratio
          canvas.height = img.height * ratio
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
    })

  const handleCapture = async (angle: 'frontUri' | 'sideUri' | 'backUri', file: File) => {
    const uri = await resizeImage(file)
    const today = new Date().toISOString().slice(0, 10)
    const existing = photos.find((p) => p.localDate === today)
    if (existing) {
      onAdd({ ...existing, [angle]: uri })
    } else {
      onAdd({ localDate: today, frontUri: null, sideUri: null, backUri: null, [angle]: uri })
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-20 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="size-5 text-accent" aria-hidden />
          <h1 className="text-lg font-bold text-fg">{t('progressPhotos.title')}</h1>
        </div>
        <button
          onClick={() => setCompareMode(!compareMode)}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[0.6rem] font-medium ${
            compareMode ? 'bg-accent text-accent-fg' : 'bg-accent/10 text-accent'
          }`}
        >
          <ArrowLeftRight className="size-3" /> {t('progressPhotos.compare')}
        </button>
      </div>

      {/* Captura de fotos */}
      {!compareMode && (
        <div className="rounded-xl border border-border/30 bg-bg-elevated/30 p-3">
          <p className="mb-2 text-[0.65rem] font-semibold text-fg">{t('progressPhotos.capture')}</p>
          <div className="flex gap-2">
            {(['frontUri', 'sideUri', 'backUri'] as const).map((angle) => (
              <button
                key={angle}
                onClick={() => {
                  const input = angle === 'frontUri' ? frontRef : angle === 'sideUri' ? sideRef : backRef
                  input.current?.click()
                }}
                className="flex flex-1 flex-col items-center gap-1 rounded-lg border border-border/30 bg-bg-elevated/50 py-3"
              >
                <Camera className="size-4 text-muted" />
                <span className="text-[0.55rem] text-muted">
                  {t(`progressPhotos.${angle}`)}
                </span>
              </button>
            ))}
          </div>
          <input ref={frontRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleCapture('frontUri', e.target.files[0])} />
          <input ref={sideRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleCapture('sideUri', e.target.files[0])} />
          <input ref={backRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleCapture('backUri', e.target.files[0])} />
        </div>
      )}

      {/* Comparador */}
      {compareMode && (
        <div className="rounded-xl border border-border/30 bg-bg-elevated/30 p-3">
          <p className="mb-2 text-[0.65rem] font-semibold text-fg">{t('progressPhotos.selectDates')}</p>
          <div className="flex gap-2 mb-3">
            <select value={dateA} onChange={(e) => setDateA(e.target.value)} className="flex-1 rounded-lg border border-border/30 bg-bg-elevated/50 px-2 py-1.5 text-[0.6rem] text-fg">
              <option value="">{t('progressPhotos.dateA')}</option>
              {dates.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={dateB} onChange={(e) => setDateB(e.target.value)} className="flex-1 rounded-lg border border-border/30 bg-bg-elevated/50 px-2 py-1.5 text-[0.6rem] text-fg">
              <option value="">{t('progressPhotos.dateB')}</option>
              {dates.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {(photoA || photoB) && (
            <div className="grid grid-cols-2 gap-2">
              {(['frontUri', 'sideUri', 'backUri'] as const).map((angle) => (
                <div key={angle} className="flex flex-col gap-1">
                  <p className="text-[0.55rem] text-muted text-center">{t(`progressPhotos.${angle}`)}</p>
                  <div className="flex gap-1">
                    {photoA?.[angle] ? <img src={photoA[angle]!} className="h-24 flex-1 rounded-lg object-cover" alt="" /> : <div className="h-24 flex-1 rounded-lg bg-bg-elevated/50" />}
                    {photoB?.[angle] ? <img src={photoB[angle]!} className="h-24 flex-1 rounded-lg object-cover" alt="" /> : <div className="h-24 flex-1 rounded-lg bg-bg-elevated/50" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="flex flex-col gap-2">
        {sorted.length === 0 ? (
          <p className="text-[0.65rem] text-muted">{t('progressPhotos.empty')}</p>
        ) : (
          sorted.map((p) => (
            <div key={p.id} className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2.5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[0.65rem] font-semibold text-fg">{p.localDate}</p>
                <button onClick={() => onDelete(p.id)} className="text-muted hover:text-red-400">
                  <Trash2 className="size-3" />
                </button>
              </div>
              <div className="flex gap-1">
                {(['frontUri', 'sideUri', 'backUri'] as const).map((angle) => (
                  <div key={angle} className="flex flex-col items-center gap-0.5">
                    {p[angle] ? <img src={p[angle]!} className="h-20 flex-1 rounded-lg object-cover" alt="" /> : <div className="h-20 flex-1 rounded-lg bg-bg-elevated/50" />}
                    <span className="text-[0.45rem] text-muted">{t(`progressPhotos.${angle}`)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
