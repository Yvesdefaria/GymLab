// Historial de fotos de progreso en filas hairline: fecha, cantidad de fotos,
// tres miniaturas y apertura del sheet de la fecha. Paginado de a 10.
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { usePagedList } from '@/hooks/usePagedList'
import { countPhotoAngles } from '@/domain/bodyProgress'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { ProgressPhotoEntry } from '@/domain/types'

const PAGE_SIZE = 10
const ANGLES = ['frontUri', 'sideUri', 'backUri'] as const

type Props = {
  photos: ProgressPhotoEntry[]
  onOpen: (entry: ProgressPhotoEntry) => void
}

export const ProgressPhotosTimeline = ({ photos, onOpen }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { visible, hasMore, showMore } = usePagedList(photos, PAGE_SIZE)

  return (
    <section className="border-t border-border/40 pt-4">
      <div className="flex items-baseline justify-between gap-2 pb-1">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t('progressPhotos.historial')}
        </h2>
        <span className="text-[10px] text-muted">
          {t('progressPhotos.dateCount', { count: photos.length })}
        </span>
      </div>

      {visible.map((entry) => {
        const date = formatDate(entry.localDate + 'T12:00:00', lang, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
        return (
          <button
            key={entry.id}
            type="button"
            data-photo-date={entry.localDate}
            onClick={() => onOpen(entry)}
            aria-label={t('progressPhotos.openDate', { fecha: date })}
            className="flex min-h-[64px] w-full items-center gap-2 border-t border-border/10 text-left first:border-t-0"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-medium text-fg">{date}</span>
              <span className="block text-[9px] text-muted">
                {t('progressPhotos.photoCount', { count: countPhotoAngles(entry) })}
              </span>
            </span>

            <span className="flex shrink-0 gap-[3px]">
              {ANGLES.map((angle) => {
                const uri = entry[angle]
                return (
                  <span
                    key={angle}
                    className="flex h-[34px] w-[26px] items-center justify-center overflow-hidden rounded-[5px] border border-border/30 bg-bg-elevated/50"
                  >
                    {uri ? (
                      <img
                        src={uri}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="h-full w-full bg-bg-elevated" />
                    )}
                  </span>
                )
              })}
            </span>

            <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
          </button>
        )
      })}

      {hasMore && (
        <div className="pt-2">
          <Button size="sm" variant="ghost" className="w-full" onClick={showMore}>
            {t('progressPhotos.verMas')}
          </Button>
        </div>
      )}
    </section>
  )
}
