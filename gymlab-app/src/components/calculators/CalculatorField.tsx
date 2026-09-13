// Campo de entrada numérico reutilizable para las calculadoras.
import { useId } from 'react'

// Input de texto con teclado decimal: acepta coma o punto (el valor se parsea
// con parseDecimal en la página); type="number" rechaza la coma en varios teclados.
export const CalculatorField = ({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  inputMode = 'decimal',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  suffix?: string
  inputMode?: 'decimal' | 'numeric'
}) => {
  // useId garantiza una asociación label-input única aunque haya varios campos en pantalla.
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted">
        {label}
        {suffix ? <span className="ml-1 text-muted/60">({suffix})</span> : null}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
      />
    </div>
  )
}
