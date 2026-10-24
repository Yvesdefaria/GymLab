// Sheet de una fecha de fotos: tres ángulos grandes, guardar en galería y eliminar.
// El guardado/borrado lo ejecuta la página; el sheet solo presenta y cierra.
import { Image as ImageIcon, ImageDown, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
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
  saving: boolean
  onClose: () => void
  onSaveToGallery: (entry: ProgressPhotoEntry) => void
  onDelete: (entry: ProgressPhotoEntry) => void
}

export const PhotoDateSheet = ({
  entry,
  saving,
  onClose,
  onSaveToGallery,
  onDelete,
}: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const date = formatDate(entry.localDate + 'T12:00:00', lang, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const hasAny = ANGLES.some((angle) => entry[angle])

  return (
    <BottomSheet
      title={date}
      subtitle={t('progressPhotos.sheetSubtitle')}
      onClose={onClose}
    >
      <div className="grid grid-cols-3 gap-1.5 py-3">
        {ANGLES.map((angle) => {
          const uri = entry[angle]
          return (
            <div key={angle} className="flex flex-col gap-1">
              <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg border border-border/30 bg-bg-elevated/50">
                {uri ? (
                  <img src={uri} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted">
                    <ImageIcon className="size-4" aria-hidden />
                    <span className="text-[8px]">{t('progressPhotos.noPhoto')}</span>
                  </div>
                )}
              </div>
              <span className="text-center text-[9px] text-muted">{t(ANGLE_LABEL[angle])}</span>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          data-action="save-gallery"
          aria-label={t('progressPhotos.saveToGallery')}
          onClick={() => onSaveToGallery(entry)}
          disabled={saving || !hasAny}
        >
          <ImageDown className="size-4" aria-hidden />
          {saving ? t('progressPhotos.saving') : t('progressPhotos.saveToGallery')}
        </Button>
        <Button
          variant="danger"
          size="sm"
          className="w-full"
          data-action="delete-date"
          onClick={() => onDelete(entry)}
        >
          <Trash2 className="size-4" aria-hidden />
          {t('progressPhotos.deleteDate')}
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] w-full text-center text-xs text-muted"
        >
          {t('layout.confirm.cancel')}
        </button>
      </div>
    </BottomSheet>
  )
}
