// Página «Calorías y macros» (/calculadoras/calorias): TDEE, rangos (déficit/superávit)
// y distribución de macros según objetivo, vía domain/calculators (tdee + macros).
// Unifica la antigua calculadora de macros en una sola página.
import { useState } from 'react'
import { Beef, Droplet, Flame, TrendingDown, TrendingUp, Wheat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { useAgePrefill } from '@/hooks/useAgePrefill'
import {
  calcTDEERange,
  nivelActividadLabel,
  type Sexo,
  type NivelActividad,
} from '@/domain/calculators/tdee'
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

// Calculadora TDEE + macros: muestra resultados solo cuando todos los campos son > 0.
export const CaloriasPage = () => {
  const { t } = useTranslation()
  const [sexo, setSexo] = useState<Sexo>('hombre')
  const [edad, setEdad] = useState('')
  const [peso, setPeso] = useState('')
  const [altura, setAltura] = useState('')
  const [actividad, setActividad] = useState<NivelActividad>('sedentario')
  const [objetivo, setObjetivo] = useState<MacroObjetivo>('mantenimiento')

  // Edad pre-rellenada desde el perfil (siempre editable).
  useAgePrefill(edad, setEdad)

  // Entradas tolerantes a vacío; el resultado requiere los tres campos rellenados.
  const edadNum = parseFloat(edad) || 0
  const pesoNum = parseFloat(peso) || 0
  const alturaNum = parseFloat(altura) || 0
  const showResult = edadNum > 0 && pesoNum > 0 && alturaNum > 0

  const result = showResult
    ? calcTDEERange(pesoNum, alturaNum, edadNum, sexo, actividad)
    : null
  const macros = showResult
    ? calcMacros(pesoNum, alturaNum, edadNum, sexo, actividad, objetivo)
    : null

  return (
    <div>
      <AppHeader title={t('calculadoras.calorias.titulo')} subtitle={t('calculadoras.calorias.subtitulo')} />
      <div className="space-y-4 p-4">
        <BackLink to="/calculadoras" />

        {/* Inputs */}
        <div className="panel-light rounded-2xl p-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">{t('calculadoras.calorias.sexo')}</label>
            <div className="flex gap-2">
              {(['hombre', 'mujer'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSexo(s)}
                  aria-pressed={sexo === s}
                  className={`flex min-h-[44px] flex-1 items-center justify-center rounded-xl py-2.5 text-sm font-medium capitalize transition-colors ${
                    sexo === s
                      ? 'border border-cta bg-cta/20 text-accent-soft'
                      : 'border border-border text-muted hover:border-cta hover:text-accent-soft'
                  }`}
                >
                  {t(s === 'hombre' ? 'calculadoras.calorias.sexoHombre' : 'calculadoras.calorias.sexoMujer')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tdee-edad" className="mb-1 block text-xs font-medium text-muted">{t('calculadoras.calorias.edad')}</label>
              <input
                id="tdee-edad"
                type="number"
                min={1}
                max={120}
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
                placeholder="25"
                className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
                inputMode="numeric"
              />
            </div>
            <div>
              <label htmlFor="tdee-peso" className="mb-1 block text-xs font-medium text-muted">{t('calculadoras.calorias.peso')}</label>
              <input
                id="tdee-peso"
                type="number"
                min={1}
                max={400}
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="70"
                className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
                inputMode="decimal"
              />
            </div>
          </div>

          <div>
            <label htmlFor="tdee-altura" className="mb-1 block text-xs font-medium text-muted">{t('calculadoras.calorias.altura')}</label>
            <input
              id="tdee-altura"
              type="number"
              min={50}
              max={250}
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              placeholder="175"
              className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
              inputMode="decimal"
            />
          </div>

          <div>
            <label htmlFor="tdee-actividad" className="mb-1 block text-xs font-medium text-muted">{t('calculadoras.calorias.nivelActividad')}</label>
            <select
              id="tdee-actividad"
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
                  className={`flex min-h-[44px] flex-1 items-center justify-center rounded-xl py-2.5 text-xs font-medium transition-colors ${
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

        {/* Results */}
        {result && macros && (
          <div className="space-y-3">
            <div className="panel rounded-2xl p-4 text-center">
              <p className="kicker">{t('calculadoras.calorias.tdee')}</p>
              <p className="stat-value text-3xl">{result.tdee}</p>
              <p className="text-xs text-muted">{t('calculadoras.calorias.kcalDia')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="panel rounded-2xl p-4 text-center">
                <TrendingDown className="mx-auto mb-1 size-5 text-success" />
                <p className="kicker">{t('calculadoras.calorias.deficit')}</p>
                <p className="stat-value text-xl text-success">{result.deficit}</p>
                <p className="text-[0.65rem] text-muted">{t('calculadoras.calorias.deficitHint')}</p>
              </div>
              <div className="panel rounded-2xl p-4 text-center">
                <TrendingUp className="mx-auto mb-1 size-5 text-cta" />
                <p className="kicker">{t('calculadoras.calorias.superavit')}</p>
                <p className="stat-value text-xl text-cta">{result.superavit}</p>
                <p className="text-[0.65rem] text-muted">{t('calculadoras.calorias.superavitHint')}</p>
              </div>
            </div>

            <div className="panel rounded-2xl p-4 text-center">
              <Flame className="mx-auto mb-1 size-5 text-cta" />
              <p className="kicker">{t('calculadoras.macros.caloriasDiarias')}</p>
              <p className="stat-value text-3xl">{macros.calorias}</p>
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
                    <p className="stat-value text-xl">{macros[macro]} g</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-center text-xs text-muted">
          {t('calculadoras.calorias.disclaimer')}
        </p>
      </div>
    </div>
  )
}