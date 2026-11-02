// Enlace de retroceso con flecha hacia la izquierda, reutilizable en fichas y detalles.
import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { canNavigateBack } from '@/lib/historyDepth'

// Navegación atrás dentro de la app (historial interno), con touch target mínimo de 44px.
// Si hay historial interno vuelve de verdad (`navigate(-1)`) en vez de empujar una ruta
// nueva: así el filtro y el scroll de la lista quedan como estaban (F134/T3). `to` sigue
// siendo el destino para un deep link sin historial y para abrir en otra pestaña.
export const BackLink = ({
  to,
  label,
  className = '',
  onClick,
}: {
  to: string
  label?: string
  className?: string
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  // Hay historial interno si el router está en una entrada > 0. No sirve `location.key`:
  // `replace` la cambia aunque sigas en la primera entrada (F134/T3, R4-1).
  const canGoBack = canNavigateBack(window.history.state, location.key)

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || !canGoBack) return
    // Clic modificado o con otro botón: dejar que el navegador abra `to`.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    navigate(-1)
  }

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={`inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft ${className}`}
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label ?? t('layout.back.volver')}
    </Link>
  )
}
