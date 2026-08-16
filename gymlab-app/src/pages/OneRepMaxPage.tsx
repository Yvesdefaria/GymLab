// Página /calculadoras/1rm: estima la repetición máxima con las fórmulas de Brzycki y Epley.
import { useState } from 'react'
import { Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { CalculatorField } from '@/components/calculators/CalculatorField'
import { oneRepMaxLabel } from '@/domain/calculators/oneRepMax'
import { MAX_WEIGHT_KG } from '@/domain/calculators/plates'

export const OneRepMaxPage = () => {
  const { t } = useTranslation()
  const [peso, setPeso] = useState('')
  const [reps, setReps] = useState('')

  // Estimación en vivo; solo se muestra resultado con peso y reps positivos.
  const pesoNum = parseFloat(peso) || 0
  const repsNum = parseFloat(reps) || 0
  const result = oneRepMaxLabel(pesoNum, repsNum)
  const showResult = pesoNum > 0 && repsNum > 0

  return (
    <div>
      <AppHeader title={t('calculadoras.oneRm.titulo')} subtitle={t('calculadoras.oneRm.subtitulo')} />
      <div className="space-y-4 p-4">
        <BackLink to="/calculadoras" />

        <div className="panel-light rounded-2xl p-4">
          <p className="mb-3 text-xs text-muted">
            {t('calculadoras.oneRm.intro')}
          </p>
          <div className="space-y-3">
            <CalculatorField
              label={t('calculadoras.oneRm.pesoLevantado')}
              value={peso}
              onChange={setPeso}
              placeholder="80"
              suffix="kg"
              min={1}
              max={MAX_WEIGHT_KG}
            />
            <CalculatorField
              label={t('calculadoras.oneRm.repeticiones')}
              value={reps}
              onChange={setReps}
              placeholder="5"
              suffix="reps"
              inputMode="numeric"
              min={1}
              max={100}
            />
          </div>
        </div>

        {showResult && (
          <div className="panel rounded-2xl p-6 text-center">
            <p className="kicker">{t('calculadoras.oneRm.tuUnoRm')}</p>
            <p className="stat-value text-4xl">
              {result.brzycki} kg
            </p>
            <div className="mt-4 space-y-1.5 text-sm">
              <p className="text-muted">
                {t('calculadoras.oneRm.formulaBrzycki', { valor: result.brzycki })}
              </p>
              <p className="text-muted">
                {t('calculadoras.oneRm.formulaEpley', { valor: result.epley })}
              </p>
              <p className="text-xs text-muted">
                {t('calculadoras.oneRm.diferencia', { valor: Math.abs(result.diferenciaKg) })}
              </p>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
              <Trophy className="size-4 text-accent" aria-hidden />
              {t('calculadoras.oneRm.consejo')}
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted">
          {t('calculadoras.oneRm.disclaimer')}
        </p>
      </div>
    </div>
  )
}
