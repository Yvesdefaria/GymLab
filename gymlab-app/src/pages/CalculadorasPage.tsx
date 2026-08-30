// Página hub «Calculadoras» (/calculadoras): catálogo con búsqueda, recientes en
// localStorage y acceso al modal de discos. El estado y el filtrado viven aquí; los
// componentes de `components/calculators/` son presentacionales (reciben datos/props).
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { CalculatorSearch } from '@/components/calculators/CalculatorSearch'
import { RecentCalculators } from '@/components/calculators/RecentCalculators'
import { CalculatorCard } from '@/components/calculators/CalculatorCard'
import { PlateCalculatorRow } from '@/components/calculators/PlateCalculatorRow'
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
      <AppHeader title={t('calculadoras.hub.titulo')} subtitle={t('calculadoras.hub.subtitulo')} />
      <div className="space-y-4 p-4">
        <BackLink to="/mas" />
        <CalculatorSearch query={query} onChange={setQuery} />

        {!q && <RecentCalculators recents={recents} catalog={catalog} onOpen={handleOpen} />}

        <ul className="grid grid-cols-2 gap-3">
          {filtered.map((item) => (
            <CalculatorCard key={item.to} item={item} onOpen={handleOpen} />
          ))}
          {!q && <PlateCalculatorRow />}
        </ul>

        {q && filtered.length === 0 && (
          <EmptyState message={t('calculadoras.hub.sinResultados', { query })} />
        )}

        <p className="text-center text-xs text-muted">{t('calculadoras.hub.disclaimer')}</p>
      </div>
    </div>
  )
}