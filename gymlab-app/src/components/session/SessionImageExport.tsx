// Exportar sesión como imagen: tarjeta 1080×1080 con plantillas seleccionables,
// modo foto con recorte cover (D2), vista previa en vivo y descarga/compartir.
import { Capacitor } from '@capacitor/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Image as ImageIcon, Share2 } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { PhotoSourceSheet } from '@/components/photos/PhotoSourceSheet'
import {
  DEFAULT_PHOTO_TEMPLATE,
  SESSION_IMAGE_TEMPLATES,
  type PhotoTemplateId,
  type SessionImageData,
} from '@/domain/sessionImage'
import { buildStatsLine } from '@/domain/sessionPhotoCard'
import {
  capturePhoto,
  isNativePlatform,
  readFileAsDataUrl,
  resizeImageToDataUrl,
  type PhotoSource,
} from '@/lib/photoCapture'
import { isAbortError, pickShareTarget, shareCanvasNative, shareCanvasWeb } from '@/lib/shareImage'
import { savePhotosToGallery } from '@/lib/saveToGallery'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import { renderSessionCanvas, volumeText } from './sessionTemplates'
import { drawPhotoHero } from './sessionPhotoTemplate'

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
  const { t, i18n } = useTranslation()
  const { settings } = useSettings()
  const lang = i18n.language as AppLanguage
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Token de vigencia de la foto: invalida resoluciones tardías (ver applyPhoto).
  const photoRequestRef = useRef(0)
  const [template, setTemplate] = useState<PhotoTemplateId>(initialTemplate)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoMode, setPhotoMode] = useState(false)
  const [photoImage, setPhotoImage] = useState<HTMLImageElement | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

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

  // Línea del D2 armada en dominio puro con las etiquetas localizadas (plural incluido).
  const photoLabels = useMemo(() => {
    const stats = buildStatsLine(volumeText(data, settings.units), data.prCount, {
      volume: t('share.statsVolume'),
      prOne: t('share.prsOne'),
      prMany: t('share.prsMany'),
    })
    return {
      // localDate es 'YYYY-MM-DD': el T12:00:00 evita corrimiento de día por zona horaria.
      date: formatDate(`${data.date}T12:00:00`, lang, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      volume: stats.volume,
      prs: stats.prs,
    }
  }, [data, settings.units, t, lang])

  // La foto se decodifica aparte para poder dibujarla sincrónicamente en el canvas.
  useEffect(() => {
    if (!photoUrl) {
      setPhotoImage(null)
      return
    }
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setPhotoImage(img)
    }
    img.src = photoUrl
    return () => {
      cancelled = true
    }
  }, [photoUrl])

  // La tarjeta se re-renderiza al cambiar plantilla, datos o modo foto.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (photoMode && photoImage) {
      const ctx = canvas.getContext('2d')
      if (ctx) drawPhotoHero(ctx, data, photoLabels, photoImage)
      return
    }
    if (!photoMode) {
      renderSessionCanvas(canvas, data, labels, settings.units, template)
    }
  }, [data, labels, photoLabels, photoImage, photoMode, settings.units, template])

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

  // Foto: se guarda redimensionada (~1080) en memoria; sigue disponible al cambiar
  // de plantilla y se descarta solo con «Quitar foto».
  const applyPhoto = useCallback(async (src: string) => {
    // El token se incrementa al ARRANCAR: entre dos selecciones seguidas gana la última
    // elección, no la última resolución; y un «Quitar»/cambio de plantilla posterior
    // invalida esta resolución para que no reactive el modo foto.
    const requestId = ++photoRequestRef.current
    const resized = await resizeImageToDataUrl(src, 1080)
    if (requestId !== photoRequestRef.current) return
    setPhotoUrl(resized)
    setPhotoMode(true)
  }, [])

  const requestPhoto = useCallback(() => {
    if (isNativePlatform()) {
      setSheetOpen(true)
      return
    }
    fileInputRef.current?.click()
  }, [])

  const handlePhotoChip = () => {
    if (photoUrl) {
      setPhotoMode(true)
      return
    }
    requestPhoto()
  }

  const handleSheetSelect = useCallback(
    async (source: PhotoSource) => {
      setSheetOpen(false)
      try {
        const webPath = await capturePhoto(source)
        if (!webPath) return
        await applyPhoto(webPath)
      } catch {
        // Error real de captura: se descarta en silencio; el usuario puede reintentar.
      }
    },
    [applyPhoto]
  )

  const handleFileChange = useCallback(
    async (file: File | undefined) => {
      if (!file) return
      try {
        await applyPhoto(await readFileAsDataUrl(file))
      } catch {
        // Archivo no decodificable: se descarta en silencio para no dejar rechazos
        // sin manejar; el usuario puede reintentar.
      }
    },
    [applyPhoto]
  )

  const handleRemovePhoto = () => {
    // Invalida una resolución pendiente para que no reactive el modo foto tras «Quitar».
    photoRequestRef.current += 1
    setPhotoUrl(null)
    setPhotoMode(false)
  }

  return (
    <div
      className="flex w-full flex-col gap-3"
      data-photo-pr={data.prCount}
      data-photo-template={photoMode ? 'photo' : template}
    >
      {/* Selector: chip Foto primero + las 3 plantillas; semántica de radios. */}
      <div className="flex gap-1.5" role="radiogroup" aria-label={t('share.templateLabel')}>
        <button
          type="button"
          onClick={handlePhotoChip}
          role="radio"
          aria-checked={photoMode}
          data-template="photo"
          className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-medium transition-colors ${
            photoMode ? 'bg-accent text-accent-fg' : 'bg-bg-elevated/50 text-muted'
          }`}
        >
          <ImageIcon className="size-4" aria-hidden />
          {t('share.photo')}
        </button>
        {SESSION_IMAGE_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            type="button"
            onClick={() => {
              // Invalida una resolución pendiente: no debe revertir el cambio de plantilla.
              photoRequestRef.current += 1
              setTemplate(tmpl.id)
              setPhotoMode(false)
            }}
            role="radio"
            aria-checked={!photoMode && template === tmpl.id}
            data-template={tmpl.id}
            className={`min-h-[44px] flex-1 rounded-xl px-2 text-sm font-medium transition-colors ${
              !photoMode && template === tmpl.id ? 'bg-accent text-accent-fg' : 'bg-bg-elevated/50 text-muted'
            }`}
          >
            {t(tmpl.labelKey)}
          </button>
        ))}
      </div>

      {/* Atajo de modo foto (solo con la foto activa). */}
      {photoMode && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={requestPhoto}
            aria-label={t('share.changePhoto')}
            className="min-h-[44px] flex-1 rounded-xl bg-bg-elevated/50 px-3 text-sm text-muted"
          >
            {t('share.changePhoto')}
          </button>
          <button
            type="button"
            onClick={handleRemovePhoto}
            aria-label={t('share.removePhoto')}
            className="min-h-[44px] flex-1 rounded-xl bg-bg-elevated/50 px-3 text-sm text-muted"
          >
            {t('share.removePhoto')}
          </button>
        </div>
      )}

      {/* Tarjeta 1080×1080 renderizada en vivo (escalada con CSS). */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${t('share.preview')} — ${data.workoutName || data.date}`}
        className="w-full max-w-sm self-center rounded-2xl border border-border"
      />

      {/* Entrada de archivo (web) para elegir la foto del card. */}
      <input
        ref={fileInputRef}
        data-photo-input
        type="file"
        accept="image/*"
        className="hidden"
        aria-label={t('share.photo')}
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          void handleFileChange(file)
        }}
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

      {sheetOpen && <PhotoSourceSheet onSelect={handleSheetSelect} onClose={() => setSheetOpen(false)} />}
    </div>
  )
}
