// Fila de suplemento (F132.6): check de 44 px, nombre, dosis y frecuencia en
// eyebrow; verde solo cuando está tomado. Sin badges de color por frecuencia.
import { useTranslation } from 'react-i18next'
import { Check, X } from 'lucide-react'
import type { SupplementEntry } from '@/domain/types'
import type { I18nKey } from '@/i18n'
import { isCheckedToday } from '@/domain/supplements'

type SupplementFrequency = SupplementEntry['frequency']

const freqKey: Record<SupplementFrequency, I18nKey> = {
  diario: 'supplement.freq.diario',
  pre_entreno: 'supplement.freq.pre_entreno',
  post_entreno: 'supplement.freq.post_entreno',
  semanal: 'supplement.freq.semanal',
}

export const SupplementRow = ({
  supplement,
  onToggle,
  onDelete,
}: {
  supplement: SupplementEntry
  onToggle: (supplement: SupplementEntry) => void
  onDelete: (id: number) => void
}) => {
  const { t } = useTranslation()
  const checked = isCheckedToday(supplement)

  return (
    <div
      data-supplement={supplement.id}
      className="flex min-h-[60px] items-center gap-2.5 border-t border-border/40 py-1.5"
    >
      <button
        type="button"
        onClick={() => onToggle(supplement)}
        aria-label={t('supplement.takenToday')}
        aria-pressed={checked}
        className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          checked ? 'border-success bg-success/15 text-success' : 'border-cta/60 text-cta'
        }`}
      >
        <Check className="size-4" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-[13px] font-medium ${checked ? 'text-fg/80' : 'text-fg'}`}>
          {supplement.name}
        </p>
        <p className="mt-0.5 text-[9px] uppercase tracking-[0.1em] text-muted">
          {t(freqKey[supplement.frequency])}
          <span className="ml-1.5 normal-case tracking-normal text-muted/70">{supplement.dose}</span>
        </p>
      </div>

      <button
        type="button"
        onClick={() => onDelete(supplement.id)}
        aria-label={t('supplement.delete', { name: supplement.name })}
        className="flex size-11 shrink-0 items-center justify-center text-muted transition-colors hover:text-danger"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
