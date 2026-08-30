// Tarjeta del catálogo del hub: icono + nombre + descripción, enlaza a la calculadora.
import { Link } from 'react-router-dom'
import type { CalculatorCatalogItem } from './catalog'

export const CalculatorCard = ({
  item,
  onOpen,
}: {
  item: CalculatorCatalogItem
  onOpen: (to: string) => void
}) => {
  const { to, label, description, icon: Icon } = item
  return (
    <li>
      <Link
        to={to}
        onClick={() => onOpen(to)}
        className="flex h-[128px] flex-col items-center justify-center gap-2 panel-light rounded-2xl px-3 py-4 text-center transition-colors hover:border-gold/80"
      >
        <span className="flex size-11 items-center justify-center rounded-xl text-cta">
          <Icon className="size-5" aria-hidden />
        </span>
        <span>
          <span className="block text-sm font-medium text-fg">{label}</span>
          <span className="mt-0.5 block line-clamp-2 text-xs text-muted">{description}</span>
        </span>
      </Link>
    </li>
  )
}