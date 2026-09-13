// Input decimal controlado y reutilizable. Mantiene un borrador de texto
// mientras el usuario escribe para no perder la coma/punto al re-renderizar el
// valor numérico, y confirma el valor con `parseDecimal`. El texto inválido
// nunca se escribe como 0: solo se confirma con un decimal válido o se limpia.
import { useState } from 'react'
import { clamp, parseDecimal } from '@/domain/numberGuard'

interface DecimalInputProps {
  value: number | undefined
  onChange: (value: number | undefined) => void
  min?: number
  max?: number
  // Un 0 almacenado se muestra como vacío (peso/reps/distancia); desactivar
  // cuando el 0 es un valor legítimo y visible (RIR).
  zeroAsEmpty?: boolean
  placeholder?: string
  className?: string
  inputMode?: 'decimal' | 'numeric'
  ariaLabel?: string
}

export const DecimalInput = ({
  value,
  onChange,
  min,
  max,
  zeroAsEmpty = true,
  placeholder,
  className,
  inputMode = 'decimal',
  ariaLabel,
}: DecimalInputProps) => {
  const [draft, setDraft] = useState<string | null>(null)
  // Mientras no se escribe, el valor mostrado deriva del número almacenado.
  const stored = value === undefined || (zeroAsEmpty && value === 0) ? '' : String(value)

  const handleChange = (raw: string) => {
    setDraft(raw)
    const parsed = parseDecimal(raw)
    if (!parsed.ok) {
      // Vaciar el campo limpia el valor; un texto no numérico no se confirma.
      if (parsed.error === 'empty') onChange(undefined)
      return
    }
    onChange(clamp(parsed.value, min ?? -Infinity, max ?? Infinity))
  }

  return (
    <input
      type="text"
      inputMode={inputMode}
      value={draft ?? stored}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={() => setDraft(null)}
      placeholder={placeholder}
      className={className}
      aria-label={ariaLabel}
    />
  )
}
