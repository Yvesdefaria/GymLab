// Exportar sesión como imagen: tarjeta 1080×1080 con plantillas seleccionables,
// vista previa en vivo del canvas y botones de descarga/compartir.
import { Capacitor } from '@capacitor/core'
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
import { isAbortError, pickShareTarget, shareCanvasNative, shareCanvasWeb } from '@/lib/shareImage'
import { savePhotosToGallery } from '@/lib/saveToGallery'
import { renderSessionCanvas } from './sessionTemplates'

interface SessionImageExportProps {
  data: SessionImageData
  // Plantilla inicial; sin valor usa la del dominio (clásica).
  initialTemplate?: PhotoTemplateId
}

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

  // Guardar en galería (solo nativo): reusa el patrón de saveToGallery (álbum GymLab).
  // fileName sin extensión: Media la agrega al guardar; en web savePhotosToGallery agrega
  // .jpg, pero esta rama no se muestra en web.
  const handleSaveToGallery = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      await savePhotosToGallery([{ dataUrl: canvas.toDataURL('image/png'), fileName: `gymlab-${data.date}` }])
    } catch {
      // Sin permiso de galería o álbum inaccesible: no se propaga para no dejar rechazos sin manejar.
    }
  }, [data.date])

  // Share por plataforma: en nativo el WebView no expone navigator.share, así que el PNG
  // va al cache y se abre el chooser vía plugin; en web se usa la Web Share API con fallback
  // a descarga. Errores reales en web caen a descarga; cancelar (AbortError) no hace nada.
  const handleShare = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const filename = `gymlab-${data.date}.png`
    const target = pickShareTarget({
      native: Capacitor.isNativePlatform(),
      canShare: typeof navigator.canShare === 'function',
    })

    if (target === 'native') {
      try {
        await shareCanvasNative(canvas, filename, t('share.share'))
      } catch {
        // El chooser nativo no tiene fallback útil: cancelar o fallar se traga
        // para no dejar un rechazo sin manejar.
      }
      return
    }

    if (target === 'download') {
      downloadCanvas(canvas, filename)
      return
    }

    try {
      if (!(await shareCanvasWeb(canvas, filename))) downloadCanvas(canvas, filename)
    } catch (err) {
      if (!isAbortError(err)) downloadCanvas(canvas, filename)
    }
  }, [data.date, t])

  // En nativo "Descargar" no funciona (el WebView no maneja <a download>): pasa a galería.
  const isNative = Capacitor.isNativePlatform()

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
          onClick={isNative ? handleSaveToGallery : handleDownload}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-bg-elevated/50 px-4 py-3 min-h-[44px] text-sm text-muted"
        >
          <Download className="size-4" /> {t(isNative ? 'share.saveGallery' : 'share.download')}
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