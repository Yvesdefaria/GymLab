// Enlace de retroceso con flecha hacia la izquierda, reutilizable en fichas y detalles.
import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

// Navegación atrás dentro de la app (historial interno), con touch target mínimo de 44px.
export const BackLink = ({
  to,
  label = 'Volver',
  className = '',
  onClick,
}: {
  to: string
  label?: string
  className?: string
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}) => (
  <Link
    to={to}
    onClick={onClick}
    className={`inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft ${className}`}
  >
    <ArrowLeft className="size-4" aria-hidden />
    {label}
  </Link>
)
