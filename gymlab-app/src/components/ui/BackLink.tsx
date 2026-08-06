import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

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
