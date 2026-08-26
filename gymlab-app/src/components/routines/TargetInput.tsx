import { useEffect, useState } from 'react'
import { clamp } from '@/domain/numberGuard'

// Input numérico con draft local: permite dejar el campo vacío mientras se teclea
// (sin revertir a 1 al borrar) y valida/ajusta al mínimo en blur.
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
}) => {
  const [draft, setDraft] = useState(String(value))

  // Sincroniza el draft cuando el valor cambia desde fuera (p. ej. tras blur).
  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commit = () => {
    const n = Number(draft)
    onChange(clamp(Number.isFinite(n) ? n : bounds[0], bounds[0], bounds[1]))
  }

  return (
    <div>
      <label htmlFor={id} className="mb-0.5 block text-[0.65rem] uppercase text-muted">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={bounds[0]}
        max={bounds[1]}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        className="h-11 w-full rounded-xl border border-border bg-bg-elevated px-2 text-sm text-fg focus:border-cta focus:outline-none"
      />
    </div>
  )
}
