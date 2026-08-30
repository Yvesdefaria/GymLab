// Chips «Recientes» del hub de calculadoras: enlazan a la últimas abiertas (localStorage)
// y refrescan su orden en cada apertura; se autoocultan sin recientes.
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
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        <Clock className="size-3.5" aria-hidden />
        {t('calculadoras.hub.recientes')}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={() => onOpen(to)}
            className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-3 text-xs text-fg transition-colors hover:border-cta"
          >
            <Icon className="size-3.5 text-cta" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}