// Medios visuales de un ejercicio: imágenes rotativas con fallback a inicial del nombre.
import { useEffect, useState } from 'react'

type ExerciseMediaProps = {
  name: string
  imageUrls?: string[]
  className?: string
}

// Carrusel simple de fotos de referencia; muestra un placeholder si no hay imagen o falla.
export const ExerciseMedia = ({ name, imageUrls, className = '' }: ExerciseMediaProps) => {
  const urls = imageUrls?.filter(Boolean) ?? []
  const [idx, setIdx] = useState(0)
  const [failed, setFailed] = useState<Record<number, boolean>>({})

  // Rota automáticamente entre imágenes cada 1,2s si hay más de una.
  useEffect(() => {
    if (urls.length < 2) return
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % urls.length)
    }, 1200)
    return () => window.clearInterval(id)
  }, [urls.length])

  const src = urls[idx]
  const showImg = src && !failed[idx]

  return (
    <div
      className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden panel rounded-2xl ${className}`}
    >
      {showImg ? (
        <img
          src={src}
          alt={`Referencia visual: ${name}`}
          className="h-full w-full object-contain"
          // Si la imagen no carga, se marca como fallida y se muestra el placeholder.
          onError={() => setFailed((f) => ({ ...f, [idx]: true }))}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 text-muted">
          <span className="flex size-16 items-center justify-center rounded-full bg-cta/10 font-display text-3xl font-bold text-accent/50">
            {name.trim().charAt(0).toUpperCase() || '?'}
          </span>
          <span className="text-xs">Referencia no disponible</span>
        </div>
      )}
      {urls.length > 1 && showImg ? (
        // Puntos indicadores de posición dentro del carrusel.
        <div className="absolute bottom-2 flex gap-1">
          {urls.map((_, i) => (
            <span
              key={i}
              className={`size-1.5 rounded-full ${i === idx ? 'bg-cta' : 'bg-border'}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
