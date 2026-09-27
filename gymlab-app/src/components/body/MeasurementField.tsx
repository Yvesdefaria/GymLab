// Campo de entrada de una medida corporal (cm/mm) con ayuda: label + InfoTip + input numérico con sufijo.
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
    className={`ml-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${
      tag === 'min'
        ? 'bg-cta/15 text-accent'
        : 'bg-bg-soft text-muted'
    }`}
  >
    {label}
  </span>
)

export const MeasurementField = memo(
  ({ id, label, guideTip, guide, value, suffix, onChange, tagLabel, tag }: MeasurementFieldProps) => {
    return (
      <div>
        <div className="mb-1 flex items-center justify-between gap-1">
          <label htmlFor={id} className="text-sm text-muted">
            {label}
            {tag && tagLabel && <FieldTagBadge tag={tag} label={tagLabel} />}
          </label>
          <InfoTip label={guideTip}>{guide}</InfoTip>
        </div>
        <div className="relative">
          <DecimalInput
            value={value}
            onChange={onChange}
            placeholder="—"
            className="h-11 w-full rounded-xl border border-border bg-bg pr-10 text-sm font-semibold text-fg placeholder:text-muted focus:border-cta focus:outline-none"
            // DecimalInput no expone `id`: se asigna al <input> real para conservar
            // la asociación label/control (htmlFor) y los e2e que la consultan.
            inputRef={(el) => {
              if (el) el.id = id
            }}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
            {suffix}
          </span>
        </div>
      </div>
    )
  },
)
MeasurementField.displayName = 'MeasurementField'