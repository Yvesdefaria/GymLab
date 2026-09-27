// Input decimal controlado y reutilizable. Mientras el usuario escribe, el
// borrador se filtra antes de pintarlo (`resolveSanitizedDraft`, F102.3): el
// input nunca muestra texto que no pueda volver a parsearse. La confirmación
// usa `resolveDraftCommit` (parser compartido): un decimal válido se escribe,
// vacío limpia y el texto inválido nunca se convierte en 0. Enter confirma el
// borrador pendiente y avanza el foco por la cadena del bloque (F98.4).
import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { resolveDraftCommit, resolveSanitizedDraft } from '@/domain/numberGuard'

interface DecimalInputProps {
  value: number | undefined
  onChange: (value: number | undefined) => void
  min?: number
  max?: number
  // Filtro del borrador al teclear: 'integer' descarta separadores y signos
  // (reps, RIR); 'decimal' permite un único separador (peso, distancia).
  mode?: 'decimal' | 'integer'
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
  mode = 'decimal',
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
    // Filtra ANTES de pintar: el borrador visible nunca queda con texto que no
    // pueda confirmarse después; la basura se ignora y el vacío real limpia.
    const { draft: clean, shouldCommit } = resolveSanitizedDraft(raw, mode)
    setDraft(clean)
    if (shouldCommit) commit(clean)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    // Enter confirma el borrador pendiente: el vaciado real ya se confirmó al
    // teclear (clear), y un vacío nacido de texto inválido no debe limpiar el valor.
    if (draft !== null) {
      if (draft !== '') commit(draft)
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
