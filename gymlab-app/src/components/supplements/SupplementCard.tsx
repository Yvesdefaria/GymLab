// Tarjeta de un suplemento: check diario, nombre, dosis y etiqueta de frecuencia con color.
import { useTranslation } from 'react-i18next'
import { Check, Trash2, Pill } from 'lucide-react'
import type { SupplementEntry } from '@/domain/types'
import type { I18nKey } from '@/i18n'
import { isCheckedToday } from '@/domain/supplements'

type SupplementFrequency = SupplementEntry['frequency']

// Color del ring de check según la frecuencia de toma.
const freqRingClass: Record<SupplementFrequency, string> = {
  diario: 'border-accent text-accent',
  pre_entreno: 'border-emerald-500 text-emerald-500',
  post_entreno: 'border-sky-500 text-sky-500',
  semanal: 'border-amber-500 text-amber-500',
}

const freqBadgeClass: Record<SupplementFrequency, string> = {
  diario: 'bg-accent/15 text-accent',
  pre_entreno: 'bg-emerald-500/15 text-emerald-400',
  post_entreno: 'bg-sky-500/15 text-sky-400',
  semanal: 'bg-amber-500/15 text-amber-400',
}

const freqKey: Record<SupplementFrequency, I18nKey> = {
  diario: 'supplement.freq.diario',
  pre_entreno: 'supplement.freq.pre_entreno',
  post_entreno: 'supplement.freq.post_entreno',
  semanal: 'supplement.freq.semanal',
}

export const SupplementCard = ({
  supplement,
  onToggle,
  onDelete,
}: {
  supplement: SupplementEntry
  onToggle: (s: SupplementEntry) => void
  onDelete: (id: number) => void
}) => {
  const { t } = useTranslation()
  const checked = isCheckedToday(supplement)

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        checked ? 'border-accent/50 bg-accent/10' : 'border-border/30 bg-bg-elevated/30'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => onToggle(supplement)}
          aria-label={t('supplement.takenToday')}
          aria-pressed={checked}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            checked ? 'border-accent bg-accent text-accent-fg' : `${freqRingClass[supplement.frequency]} bg-transparent`
          }`}
        >
          <Check className="size-5" strokeWidth={3} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-fg">
            <Pill className="size-3.5 shrink-0 text-muted" />
            {supplement.name}
          </p>
          <p className="mt-0.5 text-xs text-muted">{supplement.dose}</p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${freqBadgeClass[supplement.frequency]}`}
        >
          {t(freqKey[supplement.frequency])}
        </span>

        <button
          type="button"
          onClick={() => onDelete(supplement.id)}
          aria-label={t('supplement.cancel')}
          className="flex h-11 w-11 shrink-0 items-center justify-center text-muted hover:text-red-400"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  )
}
