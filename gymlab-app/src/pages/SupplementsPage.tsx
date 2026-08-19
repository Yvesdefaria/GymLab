// Suplementación: lista de suplementos activos con check diario de tomas.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pill, Plus, Trash2, Check } from 'lucide-react'
import { getActiveSupplements } from '@/domain/supplements'
import type { SupplementEntry } from '@/domain/types'

interface SupplementsPageProps {
  supplements: SupplementEntry[]
  onAdd: (s: Omit<SupplementEntry, 'id' | 'createdAt'>) => void
  onDelete: (id: number) => void
}

export const SupplementsPage = ({ supplements, onAdd, onDelete }: SupplementsPageProps) => {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [frequency, setFrequency] = useState<SupplementEntry['frequency']>('diario')
  const [checkedToday, setCheckedToday] = useState<Set<number>>(new Set())

  const active = getActiveSupplements(supplements)

  const handleAdd = () => {
    if (!name || !dose) return
    onAdd({ name, dose, frequency, active: true })
    setName('')
    setDose('')
    setShowForm(false)
  }

  const toggleCheck = (id: number) => {
    setCheckedToday((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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
          className="flex items-center gap-1 rounded-lg bg-accent/10 px-2 py-1 text-[0.6rem] font-medium text-accent"
        >
          <Plus className="size-3" /> {t('supplement.add')}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2.5">
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder={t('supplement.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-border/30 bg-bg-elevated/50 px-2 py-1.5 text-[0.65rem] text-fg"
            />
            <input
              type="text"
              placeholder={t('supplement.dose')}
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              className="rounded-lg border border-border/30 bg-bg-elevated/50 px-2 py-1.5 text-[0.65rem] text-fg"
            />
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as SupplementEntry['frequency'])}
              className="rounded-lg border border-border/30 bg-bg-elevated/50 px-2 py-1.5 text-[0.65rem] text-fg"
            >
              <option value="diario">{t('supplement.freq.diario')}</option>
              <option value="pre_entreno">{t('supplement.freq.pre_entreno')}</option>
              <option value="post_entreno">{t('supplement.freq.post_entreno')}</option>
              <option value="semanal">{t('supplement.freq.semanal')}</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg bg-bg-elevated/50 px-2 py-1.5 text-[0.6rem] text-muted"
              >
                {t('supplement.cancel')}
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 rounded-lg bg-accent px-2 py-1.5 text-[0.6rem] font-medium text-accent-fg"
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
          <p className="text-[0.65rem] text-muted">{t('supplement.none')}</p>
        ) : (
          active.map((s) => (
            <div
              key={s.id}
              className={`rounded-xl border px-3 py-2.5 transition-colors ${
                checkedToday.has(s.id)
                  ? 'border-accent/50 bg-accent/10'
                  : 'border-border/30 bg-bg-elevated/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleCheck(s.id)}
                  className={`flex size-5 items-center justify-center rounded-full border transition-colors ${
                    checkedToday.has(s.id)
                      ? 'border-accent bg-accent text-accent-fg'
                      : 'border-border/50 text-transparent'
                  }`}
                >
                  <Check className="size-3" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.65rem] font-semibold text-fg truncate">{s.name}</p>
                  <p className="text-[0.55rem] text-muted">
                    {s.dose} · {s.frequency === 'diario' ? t('supplement.freq.diario') : s.frequency === 'pre_entreno' ? t('supplement.freq.pre_entreno') : s.frequency === 'post_entreno' ? t('supplement.freq.post_entreno') : t('supplement.freq.semanal')}
                  </p>
                </div>
                <button onClick={() => onDelete(s.id)} className="text-muted hover:text-red-400">
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
