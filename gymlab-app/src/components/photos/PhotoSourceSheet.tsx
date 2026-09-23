// Sheet de elección de fuente de foto (cámara o galería) para flujos nativos.
import { useTranslation } from 'react-i18next'
import { Camera, Image as ImageIcon, X } from 'lucide-react'
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape'
import type { PhotoSource } from '@/lib/photoCapture'

const optionCls =
  'flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-border/30 bg-bg-elevated/50 px-4 py-3 text-left text-sm font-medium text-fg transition-colors hover:border-cta'

export const PhotoSourceSheet = ({
  onSelect,
  onClose,
}: {
  onSelect: (source: PhotoSource) => void
  onClose: () => void
}) => {
  const { t } = useTranslation()
  useCloseOnEscape(onClose)
  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('photoSource.title')}
        onClick={(e) => e.stopPropagation()}
        className="panel-floating w-full max-w-md rounded-t-3xl p-5 sm:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-base font-semibold text-fg">{t('photoSource.title')}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('layout.confirm.close')}
            className="flex size-11 items-center justify-center rounded-xl text-muted transition-colors hover:text-accent-soft"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <button type="button" onClick={() => onSelect('camera')} className={optionCls}>
            <Camera className="size-5 text-accent" aria-hidden />
            {t('photoSource.camera')}
          </button>
          <button type="button" onClick={() => onSelect('gallery')} className={optionCls}>
            <ImageIcon className="size-5 text-accent" aria-hidden />
            {t('photoSource.gallery')}
          </button>
        </div>
      </div>
    </div>
  )
}
