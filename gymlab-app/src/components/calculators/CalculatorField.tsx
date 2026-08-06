import { useId } from 'react'

export const CalculatorField = ({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  inputMode = 'decimal',
  min,
  max,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  suffix?: string
  inputMode?: 'decimal' | 'numeric'
  min?: number
  max?: number
}) => {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted">
        {label}
        {suffix ? <span className="ml-1 text-muted/60">({suffix})</span> : null}
      </label>
      <input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        min={min}
        max={max}
        className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted/70 focus:border-cta focus:outline-none"
      />
    </div>
  )
}
