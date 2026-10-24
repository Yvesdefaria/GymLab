// Fila de captura «Hoy» de /progreso-fotos: tres slots de 64 px. Si la fecha ya
// tiene foto de un ángulo, muestra la miniatura y permite reemplazarla.
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { PhotoAngle } from '@/lib/photoCapture'
import type { ProgressPhotoEntry } from '@/domain/types'

const ANGLES: PhotoAngle[] = ['frontUri', 'sideUri', 'backUri']
const ANGLE_LABEL = {
  frontUri: 'progressPhotos.frontUri',
  sideUri: 'progressPhotos.sideUri',
  backUri: 'progressPhotos.backUri',
} as const

type Props = {
  todayEntry: ProgressPhotoEntry | null
  onSelect: (angle: PhotoAngle) => void
}

export const ProgressPhotosCapture = ({ todayEntry, onSelect }: Props) => {
  const { t } = useTranslation()

  return (
    <section>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t('progressPhotos.hoy')}
        </h2>
        <span className="text-[9.5px] text-muted">{t('progressPhotos.capturar')}</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {ANGLES.map((angle) => {
          const uri = todayEntry?.[angle] ?? null
          return (
            <button
              key={angle}
              type="button"
              onClick={() => onSelect(angle)}
              className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-gold/30 bg-gold/[0.03] px-1 py-1.5 text-gold transition-colors hover:border-gold/60"
            >
              {uri ? (
                <img
                  src={uri}
                  alt=""
                  loading="lazy"
                  className="h-14 w-full rounded-[6px] object-cover"
                />
              ) : (
                <Plus className="size-4" aria-hidden />
              )}
              <span className="text-[9px] text-muted">{t(ANGLE_LABEL[angle])}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
