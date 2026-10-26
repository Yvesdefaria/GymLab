// Campo de una medida corporal (cm/mm): label compacto, badge mín/opcional e input hairline.
// Genérico: lo usan medidas por zonas (cm) y pliegues cutáneos (mm); memoizado por campo.
import { memo } from 'react'
import { InfoTip } from '@/components/ui/InfoTip'
import { DecimalInput } from '@/components/ui/DecimalInput'

type FieldTag = 'min' | 'opt'

interface MeasurementFieldProps {
  id: string
  label: string
  guideTip: string
  guide: string
  value: number | undefined
  suffix: string
  onChange: (value: number | undefined) => void
  tagLabel?: string
  tag?: FieldTag
}

// Badge compacto junto al label: 'min' (recomendado/mínimo) o 'opt' (opcional).
const FieldTagBadge = ({ tag, label }: { tag: FieldTag; label: string }) => (
  <span
    className={`ml-1 inline-flex items-center rounded-full px-1 py-0.5 text-[8px] font-medium leading-none ${
      tag === 'min' ? 'bg-cta/15 text-gold-bright' : 'text-muted/80'
    }`}
  >
    {label}
  </span>
)

export const MeasurementField = memo(
  ({ id, label, guideTip, guide, value, suffix, onChange, tagLabel, tag }: MeasurementFieldProps) => {
    return (
      <div>
        <div className="flex items-center justify-between gap-1">
          <label
            htmlFor={id}
            className="text-[9px] font-semibold tracking-[0.04em] text-muted"
          >
            {label}{' '}
            {tag && tagLabel && <FieldTagBadge tag={tag} label={tagLabel} />}
          </label>
          <InfoTip label={guideTip}>{guide}</InfoTip>
        </div>
        <div className="flex items-baseline gap-1 border-b border-border/40 pb-0.5">
          <DecimalInput
            value={value}
            onChange={onChange}
            placeholder="—"
            className="h-8 w-full border-0 bg-transparent p-0 text-right font-display text-base font-light tabular-nums text-fg placeholder:text-muted/60 focus:outline-none"
            // DecimalInput no expone `id`: se asigna al <input> real para conservar
            // la asociación label/control (htmlFor) y los e2e que la consultan.
            inputRef={(el) => {
              if (el) el.id = id
            }}
          />
          <span className="text-[9px] text-muted">{suffix}</span>
        </div>
      </div>
    )
  },
)
MeasurementField.displayName = 'MeasurementField'
