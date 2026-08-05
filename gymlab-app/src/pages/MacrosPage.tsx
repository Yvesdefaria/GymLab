import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Beef, Droplet, Flame, Wheat } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { CalculatorField } from '@/components/calculators/CalculatorField'
import { nivelActividadLabel, type Sexo, type NivelActividad } from '@/domain/calculators/tdee'
import {
  calcMacros,
  macroObjetivoLabel,
  type MacroObjetivo,
} from '@/domain/calculators/macros'

const macroIcons = {
  proteina: Beef,
  carbohidratos: Wheat,
  grasas: Droplet,
} as const

export const MacrosPage = () => {
  const [sexo, setSexo] = useState<Sexo>('hombre')
  const [edad, setEdad] = useState('')
  const [peso, setPeso] = useState('')
  const [altura, setAltura] = useState('')
  const [actividad, setActividad] = useState<NivelActividad>('sedentario')
  const [objetivo, setObjetivo] = useState<MacroObjetivo>('mantenimiento')

  const edadNum = parseFloat(edad) || 0
  const pesoNum = parseFloat(peso) || 0
  const alturaNum = parseFloat(altura) || 0
  const showResult = edadNum > 0 && pesoNum > 0 && alturaNum > 0

  const result = showResult
    ? calcMacros(pesoNum, alturaNum, edadNum, sexo, actividad, objetivo)
    : null

  return (
    <div>
      <AppHeader title="Macros" subtitle="TDEE y distribución de nutrientes" />
      <div className="space-y-4 p-4">
        <Link
          to="/calculadoras"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft"
        >
          <ArrowLeft className="size-4" />
          Calculadoras
        </Link>

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
            <CalculatorField label="Edad" value={edad} onChange={setEdad} placeholder="25" inputMode="numeric" />
            <CalculatorField label="Peso" value={peso} onChange={setPeso} placeholder="70" suffix="kg" />
          </div>

          <CalculatorField label="Altura" value={altura} onChange={setAltura} placeholder="175" suffix="cm" />

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

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Objetivo</label>
            <div className="flex gap-2">
              {(['volumen', 'mantenimiento', 'definicion'] as const).map((o) => (
                <button
                  key={o}
                  onClick={() => setObjetivo(o)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-medium transition-colors ${
                    objetivo === o
                      ? 'border border-cta bg-cta/20 text-accent-soft'
                      : 'border border-border text-muted hover:border-cta hover:text-accent-soft'
                  }`}
                >
                  {macroObjetivoLabel[o].split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {result && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4 text-center">
              <Flame className="mx-auto mb-1 size-5 text-cta" />
              <p className="text-xs uppercase tracking-wider text-muted">Calorías diarias</p>
              <p className="font-display text-3xl font-bold text-fg">{result.calorias}</p>
              <p className="text-xs text-muted">kcal/día · {macroObjetivoLabel[objetivo]}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(['proteina', 'carbohidratos', 'grasas'] as const).map((macro) => {
                const Icon = macroIcons[macro]
                return (
                  <div key={macro} className="rounded-2xl border border-gold/40 bg-bg-elevated p-4 text-center">
                    <Icon className="mx-auto mb-1 size-5 text-accent" />
                    <p className="text-xs uppercase tracking-wider text-muted">
                      {macro === 'proteina' ? 'Proteína' : macro === 'carbohidratos' ? 'Carbs' : 'Grasas'}
                    </p>
                    <p className="font-display text-xl font-bold text-fg">{result[macro]} g</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted">
          Resultado orientativo basado en Mifflin-St Jeor. No sustituye consejo nutricional profesional.
        </p>
      </div>
    </div>
  )
}
