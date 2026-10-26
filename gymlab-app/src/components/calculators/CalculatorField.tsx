// Campo de entrada de una calculadora: fila hairline con label a la izquierda y valor a la
// derecha. El control sigue siendo un DecimalInput con placeholder y label asociado.
import { useId } from 'react'
import { DecimalInput } from '@/components/ui/DecimalInput'

export const CalculatorField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  suffix,
  mode = 'decimal',
}: {
  id?: string
  label: string
  value: number | undefined
  onChange: (v: number | undefined) => void
  placeholder?: string
  suffix?: string
  mode?: 'decimal' | 'integer'
}) => {
  // useId garantiza una asociación label-input única; `id` permite conservar contratos e2e.
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <label
      htmlFor={inputId}
      className="flex min-h-[52px] items-center justify-between gap-3 border-b border-border/40"
    >
      <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <span className="flex items-baseline gap-1.5">
        <DecimalInput
          value={value}
          onChange={onChange}
          mode={mode}
          inputMode={mode === 'integer' ? 'numeric' : 'decimal'}
          placeholder={placeholder}
          className="h-10 w-28 border-0 bg-transparent p-0 text-right font-display text-lg font-light tabular-nums text-fg placeholder:font-body placeholder:text-sm placeholder:font-normal placeholder:text-muted/70 focus:outline-none"
          // DecimalInput no expone `id`: se asigna al <input> real para conservar
          // la asociación label/control (htmlFor) que genera useId.
          inputRef={(el) => {
            if (el) el.id = inputId
          }}
        />
        {suffix ? <span className="text-[10px] text-muted">{suffix}</span> : null}
      </span>
    </label>
  )
}
