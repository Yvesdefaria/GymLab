// Chips «Recientes» del hub: enlazan a las últimas calculadoras abiertas (localStorage).
import { Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { CalculatorCatalogItem } from './catalog'

export const RecentCalculators = ({
  recents,
  catalog,
  onOpen,
}: {
  recents: string[]
  catalog: CalculatorCatalogItem[]
  onOpen: (to: string) => void
}) => {
  const { t } = useTranslation()
  if (recents.length === 0) return null

  const items = recents
    .map((to) => catalog.find((c) => c.to === to))
    .filter((c): c is CalculatorCatalogItem => c !== undefined)

  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <p className="flex shrink-0 items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
        <Clock className="size-3" aria-hidden />
        {t('calculadoras.hub.recientes')}
      </p>
      <div className="flex gap-1.5 overflow-hidden">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={() => onOpen(to)}
            className="flex min-h-[32px] shrink-0 items-center gap-1.5 rounded-full border border-gold/25 bg-cta/5 px-2.5 text-[10px] font-semibold text-gold-bright"
          >
            <Icon className="size-3" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
