// Héroe de /progreso-fotos: la última sesión de tres ángulos, con las fotos reales
// o placeholders honestos. Tocar la sesión abre el sheet de la fecha.
import { Image as ImageIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { countPhotoAngles } from '@/domain/bodyProgress'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { ProgressPhotoEntry } from '@/domain/types'

const ANGLES = ['frontUri', 'sideUri', 'backUri'] as const
const ANGLE_LABEL = {
  frontUri: 'progressPhotos.frontUri',
  sideUri: 'progressPhotos.sideUri',
  backUri: 'progressPhotos.backUri',
} as const

type Props = {
  entry: ProgressPhotoEntry
  photoCount: number
  dateCount: number
  onOpen: () => void
}

export const ProgressPhotosHero = ({ entry, photoCount, dateCount, onOpen }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const date = formatDate(entry.localDate + 'T12:00:00', lang, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const angles = countPhotoAngles(entry)
  const photosLabel = t('progressPhotos.photoCount', { count: photoCount })
  const datesLabel = t('progressPhotos.dateCount', { count: dateCount })
  const emptyLabel = t('progressPhotos.noPhoto')

  return (
    <section>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t('progressPhotos.ultimaSesion')}
        </h2>
        <span className="text-[10px] text-muted">{date}</span>
      </div>

      <button
        type="button"
        onClick={onOpen}
        aria-label={t('progressPhotos.openDate', { fecha: date })}
        className="mt-2 block w-full text-left"
      >
        <span className="grid grid-cols-3 gap-1.5">
          {ANGLES.map((angle) => {
            const uri = entry[angle]
            return (
              <span key={angle} className="flex flex-col gap-1">
                <span className="relative block aspect-[3/4] overflow-hidden rounded-[10px] border border-border/30 bg-gradient-to-b from-bg-elevated to-bg">
                  {uri ? (
                    <img
                      src={uri}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted">
                      <ImageIcon className="size-4" aria-hidden />
                      <span className="text-[8px]">{emptyLabel}</span>
                    </span>
                  )}
                </span>
                <span className="text-center text-[9px] text-muted">
                  {t(ANGLE_LABEL[angle])}
                </span>
              </span>
            )
          })}
        </span>
      </button>

      <p className="mt-1.5 text-[9.5px] text-muted">
        {t('progressPhotos.anglesCount', { count: angles })} · {photosLabel} · {datesLabel}
      </p>
    </section>
  )
}
