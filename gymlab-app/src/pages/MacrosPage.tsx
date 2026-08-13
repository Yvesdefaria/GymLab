// Página /calculadoras/calorias: cálculo en vivo de calorías (Mifflin-St Jeor) y macros por objetivo.
import { useState } from 'react'
import { Beef, Droplet, Flame, Wheat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { CalculatorField } from '@/components/calculators/CalculatorField'
import { useAgePrefill } from '@/hooks/useAgePrefill'
import { nivelActividadLabel, type Sexo, type NivelActividad } from '@/domain/calculators/tdee'
import {
  calcMacros,
  macroObjetivoLabel,
  type MacroObjetivo,
} from '@/domain/calculators/macros'

// Icono de cada macronutriente para las tarjetas de resultado.
const macroIcons = {
  proteina: Beef,
  carbohidratos: Wheat,
  grasas: Droplet,
} as const

export const MacrosPage = () => {
  const { t } = useTranslation()
  const [sexo, setSexo] = useState<Sexo>('hombre')
  const [edad, setEdad] = useState('')
  const [peso, setPeso] = useState('')
  const [altura, setAltura] = useState('')
  const [actividad, setActividad] = useState<NivelActividad>('sedentario')
  const [objetivo, setObjetivo] = useState<MacroObjetivo>('mantenimiento')

  // Edad pre-rellenada desde el perfil (siempre editable).
  useAgePrefill(edad, setEdad)

  const edadNum = parseFloat(edad) || 0
  const pesoNum = parseFloat(peso) || 0
  const alturaNum = parseFloat(altura) || 0
  // Solo se calcula si están completos edad, peso y altura (datos obligatorios de la fórmula).
  const showResult = edadNum > 0 && pesoNum > 0 && alturaNum > 0

  const result = showResult
    ? calcMacros(pesoNum, alturaNum, edadNum, sexo, actividad, objetivo)
    : null

  return (
    <div>
      <AppHeader title={t('calculadoras.macros.titulo')} subtitle={t('calculadoras.macros.subtitulo')} />
      <div className="space-y-4 p-4">
        <BackLink to="/calculadoras" />

        <div className="panel rounded-2xl p-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">{t('calculadoras.macros.sexo')}</label>
            <div className="flex gap-2">
              {(['hombre', 'mujer'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSexo(s)}
                  aria-pressed={sexo === s}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium capitalize transition-colors ${
                    sexo === s
                      ? 'border border-cta bg-cta/20 text-accent-soft'
                      : 'border border-border text-muted hover:border-cta hover:text-accent-soft'
                  }`}
                >
                  {t(s === 'hombre' ? 'calculadoras.macros.sexoHombre' : 'calculadoras.macros.sexoMujer')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CalculatorField label={t('calculadoras.macros.edad')} value={edad} onChange={setEdad} placeholder="25" inputMode="numeric" min={1} max={120} />
            <CalculatorField label={t('calculadoras.macros.peso')} value={peso} onChange={setPeso} placeholder="70" suffix="kg" min={1} max={400} />
          </div>

          <CalculatorField label={t('calculadoras.macros.altura')} value={altura} onChange={setAltura} placeholder="175" suffix="cm" min={50} max={250} />

          <div>
            <label htmlFor="macros-actividad" className="mb-1 block text-xs font-medium text-muted">{t('calculadoras.macros.nivelActividad')}</label>
            <select
              id="macros-actividad"
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
            <label className="mb-1 block text-xs font-medium text-muted">{t('calculadoras.macros.objetivo')}</label>
            <div className="flex gap-2">
              {(['volumen', 'mantenimiento', 'definicion'] as const).map((o) => (
                <button
                  key={o}
                  onClick={() => setObjetivo(o)}
                  aria-pressed={objetivo === o}
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
            <div className="panel rounded-2xl p-4 text-center">
              <Flame className="mx-auto mb-1 size-5 text-cta" />
              <p className="kicker">{t('calculadoras.macros.caloriasDiarias')}</p>
              <p className="stat-value text-3xl">{result.calorias}</p>
              <p className="text-xs text-muted">
                {t('calculadoras.macros.kcalDiaObjetivo', { objetivo: macroObjetivoLabel[objetivo] })}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(['proteina', 'carbohidratos', 'grasas'] as const).map((macro) => {
                const Icon = macroIcons[macro]
                return (
                  <div key={macro} className="panel rounded-2xl p-4 text-center">
                    <Icon className="mx-auto mb-1 size-5 text-accent" />
                    <p className="kicker">
                      {macro === 'proteina'
                        ? t('calculadoras.macros.proteina')
                        : macro === 'carbohidratos'
                          ? t('calculadoras.macros.carbohidratos')
                          : t('calculadoras.macros.grasas')}
                    </p>
                    <p className="stat-value text-xl">{result[macro]} g</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted">
          {t('calculadoras.macros.disclaimer')}
        </p>
      </div>
    </div>
  )
}
