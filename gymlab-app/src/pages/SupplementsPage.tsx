// Suplementación: lista de suplementos activos con check diario de tomas.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pill, Plus, Trash2, Check } from 'lucide-react'
import { getActiveSupplements, isCheckedToday } from '@/domain/supplements'
import type { SupplementEntry } from '@/domain/types'

interface SupplementsPageProps {
  supplements: SupplementEntry[]
  onAdd: (s: Omit<SupplementEntry, 'id' | 'createdAt'>) => void
  onUpdate: (id: number, changes: Partial<SupplementEntry>) => void
  onDelete: (id: number) => void
}

export const SupplementsPage = ({ supplements, onAdd, onUpdate, onDelete }: SupplementsPageProps) => {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [frequency, setFrequency] = useState<SupplementEntry['frequency']>('diario')

  const active = getActiveSupplements(supplements)

  const handleAdd = () => {
    if (!name || !dose) return
    onAdd({ name, dose, frequency, active: true })
    setName('')
    setDose('')
    setShowForm(false)
  }

  const toggleCheck = (s: SupplementEntry) => {
    onUpdate(s.id, {
      lastCheckedAt: isCheckedToday(s) ? undefined : new Date().toISOString(),
    })
  }

  const freqLabel = (f: SupplementEntry['frequency']) => {
    switch (f) {
      case 'diario': return t('supplement.freq.diario')
      case 'pre_entreno': return t('supplement.freq.pre_entreno')
      case 'post_entreno': return t('supplement.freq.post_entreno')
      case 'semanal': return t('supplement.freq.semanal')
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-20 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="size-5 text-accent" aria-hidden />
          <h1 className="text-lg font-bold text-fg">{t('supplement.title')}</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 min-h-[44px] rounded-xl bg-accent/10 px-4 py-3 text-sm font-medium text-accent"
        >
          <Plus className="size-4" /> {t('supplement.add')}
        </button>
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
              onChange={(e) => setFrequency(e.target.value as SupplementEntry['frequency'])}
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
                className="flex-1 min-h-[44px] rounded-xl bg-bg-elevated/50 px-4 py-3 text-sm text-muted"
              >
                {t('supplement.cancel')}
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 min-h-[44px] rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-fg"
              >
                {t('supplement.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de suplementos */}
      <div className="flex flex-col gap-2">
        {active.length === 0 ? (
          <p className="text-sm text-muted">{t('supplement.none')}</p>
        ) : (
          active.map((s) => (
            <div
              key={s.id}
              className={`rounded-2xl border px-4 py-3 transition-colors ${
                isCheckedToday(s)
                  ? 'border-accent/50 bg-accent/10'
                  : 'border-border/30 bg-bg-elevated/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleCheck(s)}
                  className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border transition-colors ${
                    isCheckedToday(s)
                      ? 'border-accent bg-accent text-accent-fg'
                      : 'border-border/50 text-transparent'
                  }`}
                >
                  <Check className="size-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-fg truncate">{s.name}</p>
                  <p className="text-xs text-muted">
                    {s.dose} · {freqLabel(s.frequency)}
                  </p>
                </div>
                <button
                  onClick={() => onDelete(s.id)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-red-400"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
