// F132.2/Q4 — configuración del timer custom en bottom sheet (Nocturno).
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { DecimalInput } from '@/components/ui/DecimalInput'
import type { RoundConfig } from '@/domain/roundTimer'

type Props = {
  config: RoundConfig
  onApply: (config: RoundConfig) => void
  onClose: () => void
}

const Field = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) => (
  <label className="flex min-h-11 items-center justify-between gap-3 border-t border-border/40 py-2 first:border-t-0">
    <span className="text-sm text-fg">{label}</span>
    <DecimalInput
      value={value}
      onChange={(next) => onChange(next ?? 0)}
      min={0}
      mode="integer"
      inputMode="numeric"
      zeroAsEmpty={false}
      className="h-11 w-20 rounded-lg border border-border bg-bg px-2 text-center text-sm text-fg focus:border-cta focus:outline-none"
      ariaLabel={label}
    />
  </label>
)

export const TimerConfigSheet = ({ config, onApply, onClose }: Props) => {
  const { t } = useTranslation()
  const [work, setWork] = useState(config.workSeconds)
  const [rest, setRest] = useState(config.restSeconds)
  const [rounds, setRounds] = useState(config.totalRounds)

  return (
    <BottomSheet
      title={t('timer.config.title')}
      subtitle={t('timer.config.subtitle')}
      onClose={onClose}
    >
      <div className="mt-2">
        <Field label={t('timer.config.work')} value={work} onChange={setWork} />
        <Field label={t('timer.config.rest')} value={rest} onChange={setRest} />
        <Field label={t('timer.config.totalRounds')} value={rounds} onChange={setRounds} />
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          {t('timer.config.cancel')}
        </Button>
        <Button
          className="flex-1"
          onClick={() => onApply({ ...config, workSeconds: work, restSeconds: rest, totalRounds: rounds })}
        >
          {t('timer.config.apply')}
        </Button>
      </div>
    </BottomSheet>
  )
}
