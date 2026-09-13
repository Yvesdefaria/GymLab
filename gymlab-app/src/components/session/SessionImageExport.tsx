// Exportar sesión como imagen: tarjeta 1080×1080 con plantillas seleccionables,
// vista previa en vivo del canvas y botones de descarga/compartir.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Share2 } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import {
  DEFAULT_PHOTO_TEMPLATE,
  SESSION_IMAGE_TEMPLATES,
  type PhotoTemplateId,
  type SessionImageData,
} from '@/domain/sessionImage'
import { renderSessionCanvas } from './sessionTemplates'

interface SessionImageExportProps {
  data: SessionImageData
  // Plantilla inicial; sin valor usa la del dominio (clásica).
  initialTemplate?: PhotoTemplateId
}

const pngBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))

const downloadCanvas = (canvas: HTMLCanvasElement, filename: string): void => {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export const SessionImageExport = ({ data, initialTemplate = DEFAULT_PHOTO_TEMPLATE }: SessionImageExportProps) => {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [template, setTemplate] = useState<PhotoTemplateId>(initialTemplate)

  const labels = useMemo(
    () => ({
      duration: t('share.durationLabel'),
      volume: t('share.volumeLabel'),
      prs: t('share.prsLabel'),
      exercises: t('share.exercisesLabel'),
      footer: t('share.footer'),
    }),
    [t]
  )

  // La tarjeta se re-renderiza al cambiar plantilla o datos, con la misma fuente.
  useEffect(() => {
    if (canvasRef.current) {
      renderSessionCanvas(canvasRef.current, data, labels, settings.units, template)
    }
  }, [data, labels, settings.units, template])

  const handleDownload = useCallback(() => {
    if (canvasRef.current) downloadCanvas(canvasRef.current, `gymlab-${data.date}.png`)
  }, [data.date])

  // Share nativo con fallback a descarga; los fallos del share (p. ej. cancelación
  // del usuario) se tragan para no dejar rechazos sin manejar.
  const handleShare = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const filename = `gymlab-${data.date}.png`
    if (!navigator.share) {
      downloadCanvas(canvas, filename)
      return
    }
    try {
      const blob = await pngBlob(canvas)
      if (!blob) return
      await navigator.share({ files: [new File([blob], filename, { type: 'image/png' })] })
    } catch {
      // El usuario canceló o la plataforma no lo soportó: no se propaga.
    }
  }, [data.date])

  return (
    <div className="flex flex-col gap-3" data-photo-pr={data.prCount} data-photo-template={template}>
      {/* Selector de plantilla: chips ≥44px, semántica de radios. */}
      <div className="flex gap-2" role="radiogroup" aria-label={t('share.templateLabel')}>
        {SESSION_IMAGE_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            type="button"
            onClick={() => setTemplate(tmpl.id)}
            role="radio"
            aria-checked={template === tmpl.id}
            data-template={tmpl.id}
            className={`min-h-[44px] flex-1 rounded-xl px-3 text-sm font-medium transition-colors ${
              template === tmpl.id ? 'bg-accent text-accent-fg' : 'bg-bg-elevated/50 text-muted'
            }`}
          >
            {t(tmpl.labelKey)}
          </button>
        ))}
      </div>

      {/* Tarjeta 1080×1080 renderizada en vivo (escalada con CSS). */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${t('share.preview')} — ${data.workoutName || data.date}`}
        className="w-full max-w-sm self-center rounded-2xl border border-border"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-bg-elevated/50 px-4 py-3 min-h-[44px] text-sm text-muted"
        >
          <Download className="size-4" /> {t('share.download')}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 min-h-[44px] text-sm font-medium text-accent-fg"
        >
          <Share2 className="size-4" /> {t('share.share')}
        </button>
      </div>
    </div>
  )
}