// Medios visuales de un ejercicio: imágenes rotativas o un video corto (3 s) con la imagen
// como poster. El video es opcional: hoy el catálogo solo trae fotos, pero la ficha queda
// preparada para recibirlo sin cambiar la API de la página.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type ExerciseMediaProps = {
  name: string
  imageUrls?: string[]
  videoUrl?: string
  className?: string
}

// Respeta prefers-reduced-motion sin depender de matchMedia en entornos sin DOM.
const reducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Carrusel de fotos o video de referencia; placeholder si no hay media o falla.
export const ExerciseMedia = ({ name, imageUrls, videoUrl, className = '' }: ExerciseMediaProps) => {
  const { t } = useTranslation()
  const urls = imageUrls?.filter(Boolean) ?? []
  const [idx, setIdx] = useState(0)
  const [failed, setFailed] = useState<Record<number, boolean>>({})
  const [videoFailed, setVideoFailed] = useState(false)

  // Rota automáticamente entre imágenes cada 1,2 s si hay más de una.
  useEffect(() => {
    if (urls.length < 2) return
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % urls.length)
    }, 1200)
    return () => window.clearInterval(id)
  }, [urls.length])

  const src = urls[idx]
  const showImg = src && !failed[idx]
  // Un video de 3 s en loop es movimiento: con reduced-motion se queda la foto.
  const showVideo = Boolean(videoUrl) && !videoFailed && !reducedMotion()

  return (
    <div
      data-testid="exercise-media"
      className={`relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-bg-elevated/30 ${className}`}
    >
      {showVideo ? (
        <video
          src={videoUrl}
          poster={urls[0]}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={t('ejercicios.media.videoAlt', { nombre: name })}
          className="h-full w-full object-cover"
          onError={() => setVideoFailed(true)}
        />
      ) : showImg ? (
        <img
          src={src}
          alt={t('ejercicios.media.referenciaAlt', { nombre: name })}
          className="h-full w-full object-cover"
          onError={() => setFailed((f) => ({ ...f, [idx]: true }))}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 text-muted">
          <span className="flex size-16 items-center justify-center rounded-full bg-cta/10 font-display text-3xl font-bold text-accent/50">
            {name.trim().charAt(0).toUpperCase() || '?'}
          </span>
          <span className="text-xs">{t('ejercicios.media.referenciaNoDisponible')}</span>
        </div>
      )}

      {/* Scrim inferior: da contraste a los controles flotantes y al título. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg/90 to-transparent" aria-hidden />

      {urls.length > 1 && showImg ? (
        <div className="absolute bottom-2 flex gap-1">
          {urls.map((_, i) => (
            <span key={i} className={`size-1.5 rounded-full ${i === idx ? 'bg-cta' : 'bg-border'}`} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
