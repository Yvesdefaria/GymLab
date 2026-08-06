import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import {
  calcTDEERange,
  nivelActividadLabel,
  type Sexo,
  type NivelActividad,
} from '@/domain/calculators/tdee'

export const CaloriasPage = () => {
  const [sexo, setSexo] = useState<Sexo>('hombre')
  const [edad, setEdad] = useState('')
  const [peso, setPeso] = useState('')
  const [altura, setAltura] = useState('')
  const [actividad, setActividad] = useState<NivelActividad>('sedentario')

  const edadNum = parseFloat(edad) || 0
  const pesoNum = parseFloat(peso) || 0
  const alturaNum = parseFloat(altura) || 0
  const showResult = edadNum > 0 && pesoNum > 0 && alturaNum > 0

  const result = showResult
    ? calcTDEERange(pesoNum, alturaNum, edadNum, sexo, actividad)
    : null

  return (
    <div>
      <AppHeader title="Calorías (TDEE)" subtitle="Gasto energético diario total" />
      <div className="space-y-4 p-4">
        <Link
          to="/calculadoras"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft"
        >
          <ArrowLeft className="size-4" />
          Calculadoras
        </Link>

        {/* Inputs */}
        <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Sexo</label>
            <div className="flex gap-2">
              {(['hombre', 'mujer'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSexo(s)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium capitalize transition-colors ${
                    sexo === s
                      ? 'border border-cta bg-cta/20 text-accent-soft'
                      : 'border border-border text-muted hover:border-cta hover:text-accent-soft'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Edad</label>
              <input
                type="number"
                min={1}
                max={120}
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
                placeholder="25"
                className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Peso (kg)</label>
              <input
                type="number"
                min={1}
                max={400}
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="70"
                className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none"
                inputMode="decimal"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Altura (cm)</label>
            <input
              type="number"
              min={50}
              max={250}
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              placeholder="175"
              className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none"
              inputMode="decimal"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Nivel de actividad</label>
            <select
              value={actividad}
              onChange={(e) => setActividad(e.target.value as NivelActividad)}
              className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg focus:border-cta focus:outline-none"
            >
              {(Object.keys(nivelActividadLabel) as NivelActividad[]).map((key) => (
                <option key={key} value={key}>
                  {nivelActividadLabel[key]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-muted">TDEE (mantenimiento)</p>
              <p className="font-display text-3xl font-bold text-fg">{result.tdee}</p>
              <p className="text-xs text-muted">kcal/día</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4 text-center">
                <TrendingDown className="mx-auto mb-1 size-5 text-success" />
                <p className="text-xs uppercase tracking-wider text-muted">Déficit</p>
                <p className="font-display text-xl font-bold text-success">{result.deficit}</p>
                <p className="text-[0.65rem] text-muted">~20% menos</p>
              </div>
              <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4 text-center">
                <TrendingUp className="mx-auto mb-1 size-5 text-cta" />
                <p className="text-xs uppercase tracking-wider text-muted">Superávit</p>
                <p className="font-display text-xl font-bold text-cta">{result.superavit}</p>
                <p className="text-[0.65rem] text-muted">~15% más</p>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-center text-xs text-muted">
          Resultado orientativo basado en Mifflin-St Jeor. No sustituye consejo nutricional profesional.
        </p>
      </div>
    </div>
  )
}
