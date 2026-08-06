import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { platesForWeight, MAX_PLATE_TARGET_KG } from '@/domain/calculators/plates'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatUnits, parseWeightToKg } from '@/domain/settings'
import { clamp } from '@/domain/numberGuard'

type Props = {
  initialKg?: number
  barKg?: number
  onClose: () => void
}

export const PlateCalculatorModal = ({ initialKg = 0, barKg = 20, onClose }: Props) => {
  const { settings } = useSettings()
  const [weightInput, setWeightInput] = useState(
    initialKg > 0 ? String(Math.round(applyUnits(initialKg, settings.units) * 10) / 10) : ''
  )

  const weightKg = useMemo(
    () => clamp(parseWeightToKg(Number(weightInput) || 0, settings.units), 0, MAX_PLATE_TARGET_KG),
    [weightInput, settings.units]
  )

  const result = useMemo(() => platesForWeight(weightKg, barKg), [weightKg, barKg])

  const count = (w: number) => result.perSide.filter((p) => p === w).length

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Calculadora de discos"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border border-gold/40 bg-bg-elevated p-5 sm:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-fg">Discos por lado</h2>
          <button
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-xl border border-border text-muted hover:text-fg"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        <label className="mb-1 block kicker">
          Peso objetivo ({formatUnits(settings.units)})
        </label>
        <input
          type="number"
          min={0}
          max={MAX_PLATE_TARGET_KG}
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
          placeholder="60"
          autoFocus
          inputMode="decimal"
          className="h-12 w-full rounded-xl border border-border bg-bg px-3 text-lg font-semibold text-fg focus:border-cta focus:outline-none"
        />

        <div className="mt-4 rounded-2xl border border-gold/40 bg-bg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Barra</span>
            <span className="font-semibold text-fg">
              {applyUnits(result.barKg, settings.units).toFixed(1)} {formatUnits(settings.units)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-muted">Discos por lado</span>
            <span className="font-semibold text-fg">
              {result.perSide.length === 0 ? '—' : result.perSide.join(' + ')}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
            <span className="text-sm text-muted">Total cargado</span>
            <span className="font-display text-lg font-bold text-accent">
              {result.totalLoaded.toFixed(1)} {formatUnits(settings.units)}
              {!result.exact && ' ≈'}
            </span>
          </div>
        </div>

        {result.perSide.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {STANDARD_PLATES_FOR_UI.map((w) => {
              const n = count(w)
              if (n === 0) return null
              return (
                <span
                  key={w}
                  className="rounded-full border border-cta/40 bg-cta/10 px-3 py-1 text-xs font-semibold text-accent-soft"
                >
                  {Math.round(applyUnits(w, settings.units))}{formatUnits(settings.units)} ×{n}
                </span>
              )
            })}
          </div>
        )}

        {!result.exact && weightKg > 0 && (
          <p className="mt-3 text-xs text-muted">
            No hay discos que den el peso exacto; se acerca con la combinación mostrada.
          </p>
        )}
      </div>
    </div>
  )
}

const STANDARD_PLATES_FOR_UI = [25, 20, 15, 10, 5, 2.5, 1.25]
