// Página hub «Calculadoras» (/calculadoras): búsqueda, recientes y grilla de tiles hairline.
// El estado y el filtrado viven aquí; los componentes de `components/calculators/` son presentacionales.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { CalculatorSearch } from '@/components/calculators/CalculatorSearch'
import { RecentCalculators } from '@/components/calculators/RecentCalculators'
import { CalculatorCard } from '@/components/calculators/CalculatorCard'
import { PlateCalculatorRow } from '@/components/calculators/PlateCalculatorRow'
import { CalculatorDisclaimer } from '@/components/calculators/CalculatorDisclaimer'
import { getRecents, pushRecent, ready, type CalculatorCatalogItem } from '@/components/calculators/catalog'

export const CalculadorasPage = () => {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [recents, setRecents] = useState<string[]>(getRecents)

  // Catálogo con las etiquetas traducidas según el idioma activo.
  const catalog: CalculatorCatalogItem[] = ready.map((c) => ({
    to: c.to,
    label: t(c.labelKey),
    description: t(c.descriptionKey),
    icon: c.icon,
  }))

  // Filtro por nombre o descripción (case-insensitive) sobre el catálogo.
  const q = query.trim().toLowerCase()
  const filtered = catalog.filter(
    (c) => !q || c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
  )

  // Al abrir una calculadora la marca como reciente y refresca la lista mostrada.
  const handleOpen = (to: string) => {
    pushRecent(to)
    setRecents(getRecents())
  }

  return (
    <div>
      <AppHeader
        kicker={t('calculadoras.hub.kicker')}
        title={t('calculadoras.hub.titulo')}
        subtitle={t('calculadoras.hub.subtitulo')}
      />
      <div className="space-y-3 px-4 pb-24 pt-2">
        <BackLink to="/mas" />
        <CalculatorSearch query={query} onChange={setQuery} />

        {!q && <RecentCalculators recents={recents} catalog={catalog} onOpen={handleOpen} />}

        <div className="flex items-baseline justify-between gap-2 pt-1">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {t('calculadoras.hub.todas')}
          </h2>
          <span className="text-[9.5px] tabular-nums text-muted">
            {t('calculadoras.hub.count', { count: filtered.length })}
          </span>
        </div>

        <ul className="grid grid-cols-2 gap-2.5">
          {filtered.map((item) => (
            <CalculatorCard key={item.to} item={item} onOpen={handleOpen} />
          ))}
        </ul>

        {!q && <PlateCalculatorRow />}

        {q && filtered.length === 0 && (
          <EmptyState message={t('calculadoras.hub.sinResultados', { query })} />
        )}

        <CalculatorDisclaimer>{t('calculadoras.hub.disclaimer')}</CalculatorDisclaimer>
      </div>
    </div>
  )
}
