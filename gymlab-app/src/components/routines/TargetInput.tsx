import { DecimalInput } from '@/components/ui/DecimalInput'

// Input numérico de objetivo (series/reps/descanso) usando el borrador de
// DecimalInput: filtra al teclear, acota al rango y confirma el vacío como
// bounds[0] para conservar la semántica anterior (vacío/inválido → mínimo).
export const TargetInput = ({
  id,
  value,
  bounds,
  label,
  onChange,
}: {
  id: string
  value: number
  bounds: [number, number]
  label: string
  onChange: (value: number) => void
}) => (
  <div>
    <label htmlFor={id} className="mb-0.5 block text-[0.65rem] uppercase text-muted">
      {label}
    </label>
    <DecimalInput
      value={value}
      onChange={(v) => onChange(v ?? bounds[0])}
      mode="integer"
      inputMode="numeric"
      min={bounds[0]}
      max={bounds[1]}
      className="h-11 w-full rounded-xl border border-border bg-bg-elevated px-2 text-sm text-fg focus:border-cta focus:outline-none"
      // DecimalInput no expone `id`: se asigna al <input> real para conservar el htmlFor.
      inputRef={(el) => {
        if (el) el.id = id
      }}
    />
  </div>
)
