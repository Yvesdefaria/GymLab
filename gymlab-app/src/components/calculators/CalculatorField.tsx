// Campo de entrada numérico reutilizable para las calculadoras. El valor vive
// como número y DecimalInput filtra el borrador al teclear; `mode` se propaga.
import { useId } from 'react'
import { DecimalInput } from '@/components/ui/DecimalInput'

export const CalculatorField = ({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  mode = 'decimal',
}: {
  label: string
  value: number | undefined
  onChange: (v: number | undefined) => void
  placeholder?: string
  suffix?: string
  mode?: 'decimal' | 'integer'
}) => {
  // useId garantiza una asociación label-input única aunque haya varios campos en pantalla.
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted">
        {label}
        {suffix ? <span className="ml-1 text-muted/60">({suffix})</span> : null}
      </label>
      <DecimalInput
        value={value}
        onChange={onChange}
        mode={mode}
        inputMode={mode === 'integer' ? 'numeric' : 'decimal'}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
        // DecimalInput no expone `id`: se asigna al <input> real para conservar
        // la asociación label/control (htmlFor) que genera useId.
        inputRef={(el) => {
          if (el) el.id = id
        }}
      />
    </div>
  )
}
