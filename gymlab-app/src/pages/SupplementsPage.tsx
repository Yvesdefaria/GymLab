// Página /suplementos (F132.6): adherencia del día, filtros neutros y filas
// hairline. El alta vive en un bottom sheet; el seed y las mutaciones no cambian.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pill, Plus } from 'lucide-react'
import { getActiveSupplements, todayAdherence } from '@/domain/supplements'
import type { SupplementEntry } from '@/domain/types'
import type { I18nKey } from '@/i18n'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { FilterChips } from '@/components/ui/FilterChips'
import { SupplementsHero } from '@/components/supplements/SupplementsHero'
import { SupplementRow } from '@/components/supplements/SupplementRow'
import { AddSupplementSheet } from '@/components/supplements/AddSupplementSheet'

type SupplementFrequency = SupplementEntry['frequency']
type Filter = 'all' | SupplementFrequency

interface SupplementsPageProps {
  supplements: SupplementEntry[]
  onAdd: (s: Omit<SupplementEntry, 'id' | 'createdAt'>) => void
  onUpdate: (id: number, changes: Partial<SupplementEntry>) => void
  onDelete: (id: number) => void
}

const FILTERS: Filter[] = ['all', 'diario', 'pre_entreno', 'post_entreno', 'semanal']

const filterKey: Record<Filter, I18nKey> = {
  all: 'supplement.all',
  diario: 'supplement.freq.diario',
  pre_entreno: 'supplement.freq.pre_entreno',
  post_entreno: 'supplement.freq.post_entreno',
  semanal: 'supplement.freq.semanal',
}

export const SupplementsPage = ({ supplements, onAdd, onUpdate, onDelete }: SupplementsPageProps) => {
  const { t } = useTranslation()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')

  const active = getActiveSupplements(supplements)
  const adherence = todayAdherence(supplements)
  const filtered = filter === 'all' ? active : active.filter((s) => s.frequency === filter)
  const options = FILTERS.map((value) => ({ value, label: t(filterKey[value]) }))

  const toggleCheck = (supplement: SupplementEntry) => {
    onUpdate(supplement.id, {
      lastCheckedAt: supplement.lastCheckedAt == null ? new Date().toISOString() : undefined,
    })
  }

  return (
    <div>
      <AppHeader
        kicker={t('supplement.kicker')}
        title={t('supplement.title')}
        actions={
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label={t('supplement.addAria')}
            className="flex size-11 items-center justify-center rounded-full border border-border text-cta"
          >
            <Plus className="size-5" />
          </button>
        }
      />
      <div className="px-4 pb-24">
        <BackLink to="/mas" />

        {active.length > 0 && <SupplementsHero adherence={adherence} />}

        {active.length > 0 && (
          <FilterChips
            options={options}
            value={filter}
            onChange={(value) => setFilter(value ?? 'all')}
            ariaLabel={t('supplement.filterAria')}
            allowDeselect={false}
            className="mt-4"
          />
        )}

        {active.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Pill className="size-8 text-muted" />
            <p className="text-sm font-medium text-fg">{t('supplement.emptyTitle')}</p>
            <p className="max-w-[260px] text-xs leading-relaxed text-muted">{t('supplement.emptyText')}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setSheetOpen(true)}>
              {t('supplement.emptyCta')}
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="border-t border-border/40 py-6 text-center text-xs text-muted">
            {t('supplement.filteredEmpty')}
          </p>
        ) : (
          <div className="mt-2">
            {filtered.map((supplement) => (
              <SupplementRow
                key={supplement.id}
                supplement={supplement}
                onToggle={toggleCheck}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {sheetOpen && (
        <AddSupplementSheet
          onAdd={(supplement) => onAdd(supplement)}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  )
}
