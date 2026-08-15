// Selector de avatar de perfil: subida de foto (validada en cliente) o
// galería de avatares predefinidos de hosts conocidos (allowlist).
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ALLOWED_MIME, isSafeAvatarUri, MAX_FILE_BYTES } from '@/lib/avatar'

// Avatares predefinidos: temas gimnasio/naturaleza/animales/urbano, sin emoji.
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=200&q=60',
  'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=200&q=60',
  'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=200&q=60',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=60',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=200&q=60',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=200&q=60',
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=200&q=60',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=200&q=60',
  'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=200&q=60',
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=200&q=60',
  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=200&q=60',
  'https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=200&q=60',
]

export const AvatarPicker = ({
  currentUri,
  onSelect,
  onClose,
}: {
  currentUri: string
  onSelect: (uri: string) => void
  onClose: () => void
}) => {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState(currentUri)

  // Cierra con Escape y deja el foco en el selector al abrir.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lee y valida la foto local: MIME permitido + tamaño ≤ 2 MB, luego la guarda en base64.
  const handleFile = (file: File | undefined) => {
    setError(null)
    if (!file) return
    if (!ALLOWED_MIME.has(file.type)) {
      setError(t('perfil.avatarFormatoError'))
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(t('perfil.avatarTamanoError'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const uri = reader.result as string
      if (isSafeAvatarUri(uri)) {
        setSelected(uri)
        onSelect(uri)
        onClose()
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('perfil.avatarElegirAria')}
        className="panel-floating w-full max-w-md rounded-t-3xl p-4 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-base font-semibold text-fg">{t('perfil.avatarTitulo')}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('perfil.avatarCerrar')}
            className="flex size-11 items-center justify-center rounded-xl text-muted transition-colors hover:text-accent-soft"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <Button
          variant="outline"
          size="md"
          className="w-full"
          onClick={() => fileRef.current?.click()}
        >
          <Camera className="size-5" aria-hidden />
          {t('perfil.avatarSubirFoto')}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {error ? (
          <p role="alert" className="mt-2 text-xs text-danger">
            {error}
          </p>
        ) : null}

        <p className="mb-2 mt-4 kicker">{t('perfil.avatarPredefinidos')}</p>
        <div className="grid max-h-[30dvh] grid-cols-4 gap-3 overflow-y-auto pb-2">
          {PRESET_AVATARS.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => {
                setSelected(src)
                onSelect(src)
                onClose()
              }}
              aria-label={t('perfil.avatarUsarPredefinido')}
              className={`relative aspect-square overflow-hidden rounded-full border-2 transition-transform active:scale-95 ${
                selected === src ? 'animate-pop border-cta' : 'border-transparent'
              }`}
            >
              <img src={src} alt="" className="size-full object-cover" loading="lazy" />
              {selected === src ? (
                <span className="absolute bottom-0 right-0 flex size-5 items-center justify-center rounded-full bg-cta text-on-gold">
                  <Check className="size-3.5" aria-hidden />
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
