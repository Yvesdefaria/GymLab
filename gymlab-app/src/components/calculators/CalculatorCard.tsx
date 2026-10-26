// Tile del hub: borde hairline, icono dorado, nombre y descripción corta. Sin tarjeta ni sombra.
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
        className="flex min-h-[106px] h-full flex-col gap-1.5 rounded-xl border border-border/40 bg-bg-elevated/20 p-3 transition-colors hover:border-gold/60"
      >
        <Icon className="size-4 text-gold" aria-hidden />
        <span className="text-[12.5px] font-semibold leading-tight text-fg">{label}</span>
        <span className="line-clamp-2 text-[10px] leading-snug text-muted">{description}</span>
      </Link>
    </li>
  )
}
