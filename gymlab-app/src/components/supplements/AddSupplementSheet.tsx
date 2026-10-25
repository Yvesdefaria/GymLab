// Sheet de alta de suplemento (F132.6): nombre, dosis y frecuencia segmentada.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import type { SupplementEntry } from '@/domain/types'
import type { I18nKey } from '@/i18n'

type SupplementFrequency = SupplementEntry['frequency']

const FREQUENCIES: Array<{ value: SupplementFrequency; key: I18nKey }> = [
  { value: 'diario', key: 'supplement.freq.diario' },
  { value: 'pre_entreno', key: 'supplement.freq.pre_entreno' },
  { value: 'post_entreno', key: 'supplement.freq.post_entreno' },
  { value: 'semanal', key: 'supplement.freq.semanal' },
]

export const AddSupplementSheet = ({
  onAdd,
  onClose,
}: {
  onAdd: (supplement: Omit<SupplementEntry, 'id' | 'createdAt'>) => void
  onClose: () => void
}) => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [frequency, setFrequency] = useState<SupplementFrequency>('diario')
  const canSave = name.trim().length > 0 && dose.trim().length > 0

  const handleSave = () => {
    if (!canSave) return
    onAdd({ name: name.trim(), dose: dose.trim(), frequency, active: true })
    onClose()
  }

  return (
    <BottomSheet title={t('supplement.addTitle')} subtitle={t('supplement.addSubtitle')} onClose={onClose}>
      <div className="flex flex-col gap-2 pb-2">
        <input
          type="text"
          placeholder={t('supplement.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-[44px] rounded-xl border border-border bg-bg px-3 text-sm text-fg"
        />
        <input
          type="text"
          placeholder={t('supplement.dose')}
          value={dose}
          onChange={(e) => setDose(e.target.value)}
          className="min-h-[44px] rounded-xl border border-border bg-bg px-3 text-sm text-fg"
        />

        <div className="mt-1">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t('supplement.frequency')}
          </p>
          <div className="mt-1.5 grid grid-cols-4 overflow-hidden rounded-xl border border-border">
            {FREQUENCIES.map(({ value, key }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFrequency(value)}
                aria-pressed={frequency === value}
                className={`min-h-[44px] px-1 text-[10px] font-semibold transition-colors ${
                  frequency === value ? 'bg-cta/15 text-gold-bright' : 'text-muted'
                }`}
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex gap-2">
          <Button variant="outline" size="md" className="flex-1" onClick={onClose}>
            {t('supplement.cancel')}
          </Button>
          <Button variant="primary" size="md" className="flex-1" disabled={!canSave} onClick={handleSave}>
            {t('supplement.save')}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
