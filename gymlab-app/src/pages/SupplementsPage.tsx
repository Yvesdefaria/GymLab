// Suplementación: lista de suplementos activos con check diario, filtro por frecuencia y alta.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pill } from 'lucide-react'
import { getActiveSupplements } from '@/domain/supplements'
import type { SupplementEntry } from '@/domain/types'
import type { I18nKey } from '@/i18n'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { SupplementCard } from '@/components/supplements/SupplementCard'

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
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [frequency, setFrequency] = useState<SupplementFrequency>('diario')
  const [filter, setFilter] = useState<Filter>('all')

  const active = getActiveSupplements(supplements)
  const filtered = filter === 'all' ? active : active.filter((s) => s.frequency === filter)

  const handleAdd = () => {
    if (!name || !dose) return
    onAdd({ name, dose, frequency, active: true })
    setName('')
    setDose('')
    setShowForm(false)
  }

  const toggleCheck = (s: SupplementEntry) => {
    onUpdate(s.id, {
      lastCheckedAt: s.lastCheckedAt == null ? new Date().toISOString() : undefined,
    })
  }

  return (
    <div>
      <AppHeader title={t('supplement.title')} />
      <div className="flex flex-col gap-4 px-4 pb-20 pt-2">
        <div className="flex items-center justify-between">
          <BackLink to="/mas" />
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-accent/10 px-4 py-3 text-sm font-medium text-accent"
          >
            <Plus className="size-4" /> {t('supplement.add')}
          </button>
        </div>

        {/* Filtro por frecuencia */}
        <div className="scrollbar-hidden -mx-4 flex gap-2 overflow-x-auto px-4">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex min-h-[44px] shrink-0 items-center rounded-full px-3.5 text-sm transition-colors ${
                filter === f
                  ? 'bg-accent text-accent-fg'
                  : 'bg-bg-elevated/50 text-muted'
              }`}
            >
              {t(filterKey[f])}
            </button>
          ))}
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="rounded-2xl border border-border/30 bg-bg-elevated/30 px-4 py-3">
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder={t('supplement.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/50 px-4 py-3 text-sm text-fg"
              />
              <input
                type="text"
                placeholder={t('supplement.dose')}
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                className="min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/50 px-4 py-3 text-sm text-fg"
              />
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as SupplementFrequency)}
                className="min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/50 px-4 py-3 text-sm text-fg"
              >
                <option value="diario">{t('supplement.freq.diario')}</option>
                <option value="pre_entreno">{t('supplement.freq.pre_entreno')}</option>
                <option value="post_entreno">{t('supplement.freq.post_entreno')}</option>
                <option value="semanal">{t('supplement.freq.semanal')}</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="min-h-[44px] flex-1 rounded-xl bg-bg-elevated/50 px-4 py-3 text-sm text-muted"
                >
                  {t('supplement.cancel')}
                </button>
                <button
                  onClick={handleAdd}
                  className="min-h-[44px] flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-fg"
                >
                  {t('supplement.save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de suplementos */}
        {active.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Pill className="size-8 text-muted" />
            <p className="text-sm font-medium text-fg">{t('supplement.emptyTitle')}</p>
            <p className="max-w-[240px] text-xs text-muted">{t('supplement.emptyText')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{t('supplement.none')}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((s) => (
              <SupplementCard key={s.id} supplement={s} onToggle={toggleCheck} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
