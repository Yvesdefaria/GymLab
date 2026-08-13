// Pantalla de carga a pantalla completa con icono de mancuerna pulsante.
import { useTranslation } from 'react-i18next'
import { Dumbbell } from 'lucide-react'

// Fallback de Suspense; anuncia el estado a lectores de pantalla y desactiva la animación si hay movimiento reducido.
export const Loader = () => {
  const { t } = useTranslation()
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t('layout.loader.loading')}
      className="flex min-h-dvh items-center justify-center bg-bg"
    >
      <Dumbbell className="size-8 animate-pulse text-cta motion-reduce:animate-none" aria-hidden />
      <span className="sr-only">{t('layout.loader.loading')}</span>
    </div>
  )
}
