// Input decimal controlado y reutilizable. Mantiene un borrador de texto
// mientras el usuario escribe para no perder la coma/punto al re-renderizar el
// valor numérico, y confirma el valor con `resolveDraftCommit` (parser
// compartido). El texto inválido nunca se escribe como 0: solo se confirma con
// un decimal válido o se limpia. Enter confirma el borrador y avanza el foco
// por la cadena del bloque (F98.4).
import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { resolveDraftCommit } from '@/domain/numberGuard'

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
  // Se dispara tras confirmar el borrador con Enter: el bloque calcula el siguiente input.
  onEnter?: () => void
  // Registra el <input> real en el registro de refs del bloque (F98.4).
  inputRef?: (el: HTMLInputElement | null) => void
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
  onEnter,
  inputRef,
}: DecimalInputProps) => {
  const [draft, setDraft] = useState<string | null>(null)
  // Mientras no se escribe, el valor mostrado deriva del número almacenado.
  const stored = value === undefined || (zeroAsEmpty && value === 0) ? '' : String(value)

  // Confirma un borrador con la semántica compartida: válido → valor recortado,
  // vacío → limpiar, inválido → no se escribe (nunca se convierte en 0).
  const commit = (raw: string) => {
    const result = resolveDraftCommit(raw, min ?? -Infinity, max ?? Infinity)
    if (result.action === 'commit') onChange(result.value)
    else if (result.action === 'clear') onChange(undefined)
  }

  const handleChange = (raw: string) => {
    setDraft(raw)
    commit(raw)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    // Enter confirma el borrador pendiente (si lo hay) y delega el avance del foco.
    if (draft !== null) {
      commit(draft)
      setDraft(null)
    }
    onEnter?.()
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={inputMode}
      enterKeyHint="next"
      value={draft ?? stored}
      onChange={(e) => handleChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => setDraft(null)}
      placeholder={placeholder}
      className={className}
      aria-label={ariaLabel}
    />
  )
}
