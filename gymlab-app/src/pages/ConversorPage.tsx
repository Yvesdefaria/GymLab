import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRightLeft } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { kgToLb, lbToKg } from '@/domain/calculators/converter'

type Mode = 'kg-lb' | 'lb-kg'

export const ConversorPage = () => {
  const [mode, setMode] = useState<Mode>('kg-lb')
  const [value, setValue] = useState('')

  const num = parseFloat(value) || 0
  const from = mode === 'kg-lb' ? 'kg' : 'lb'
  const to = mode === 'kg-lb' ? 'lb' : 'kg'
  const result = num > 0 ? (mode === 'kg-lb' ? kgToLb(num) : lbToKg(num)) : 0

  return (
    <div>
      <AppHeader title="Conversor lb ↔ kg" subtitle="Peso de discos y ejercicios" />
      <div className="space-y-4 p-4">
        <Link
          to="/calculadoras"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft"
        >
          <ArrowLeft className="size-4" />
          Calculadoras
        </Link>

        <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
          <div className="mb-3 flex gap-2">
            <button
              onClick={() => setMode('kg-lb')}
              aria-pressed={mode === 'kg-lb'}
              className={`h-10 flex-1 rounded-xl text-sm font-medium transition-colors ${
                mode === 'kg-lb'
                  ? 'bg-cta text-black'
                  : 'bg-bg text-muted hover:text-accent-soft'
              }`}
            >
              kg → lb
            </button>
            <button
              onClick={() => setMode('lb-kg')}
              aria-pressed={mode === 'lb-kg'}
              className={`h-10 flex-1 rounded-xl text-sm font-medium transition-colors ${
                mode === 'lb-kg'
                  ? 'bg-cta text-black'
                  : 'bg-bg text-muted hover:text-accent-soft'
              }`}
            >
              lb → kg
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Cantidad ({from})</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="100"
              inputMode="decimal"
              aria-label={`Cantidad en ${from}`}
              className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none"
            />
          </div>
        </div>

        {num > 0 && (
          <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-6 text-center">
            <p className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-muted">
              <ArrowRightLeft className="size-4 text-accent" aria-hidden />
              Resultado
            </p>
            <p className="font-display text-4xl font-bold text-fg">
              {result.toLocaleString('es-ES')} {to}
            </p>
            <p className="mt-2 text-xs text-muted">
              {num.toLocaleString('es-ES')} {from} = {result.toLocaleString('es-ES')} {to}
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted">
          Conversión según 1 lb = 0,4536 kg.
        </p>
      </div>
    </div>
  )
}
