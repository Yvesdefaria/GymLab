// Página «Agua diaria» (/calculadoras/agua): hidratación diaria recomendada
// según peso corporal y minutos de ejercicio diario.
import { useState } from 'react'
import { Droplets } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { CalculatorField } from '@/components/calculators/CalculatorField'
import { calcDailyWater, calcVasosAgua } from '@/domain/calculators/water'
import { formatNumber } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'

// Calculadora de agua: litros y vasos derivados de domain/calculators/water.
export const AguaPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [peso, setPeso] = useState('')
  const [ejercicio, setEjercicio] = useState('0')

  // Entradas tolerantes a vacío (parse → 0); solo se muestra resultado si el peso es > 0.
  const pesoNum = parseFloat(peso) || 0
  const minutos = parseInt(ejercicio, 10) || 0
  const litros = calcDailyWater(pesoNum, minutos)
  const vasos = calcVasosAgua(litros)
  const showResult = pesoNum > 0

  return (
    <div>
      <AppHeader title={t('calculadoras.agua.titulo')} subtitle={t('calculadoras.agua.subtitulo')} />
      <div className="space-y-4 p-4">
        <BackLink to="/calculadoras" />

        <div className="panel rounded-2xl p-4">
          <p className="mb-3 text-xs text-muted">
            {t('calculadoras.agua.intro')}
          </p>
          <div className="space-y-3">
            <CalculatorField
              label={t('calculadoras.agua.pesoCorporal')}
              value={peso}
              onChange={setPeso}
              placeholder="70"
              suffix="kg"
              min={1}
              max={400}
            />
            <CalculatorField
              label={t('calculadoras.agua.ejercicioDiario')}
              value={ejercicio}
              onChange={setEjercicio}
              placeholder="0"
              suffix="min"
              inputMode="numeric"
              min={0}
              max={600}
            />
          </div>
        </div>

        {showResult && (
          <div className="panel rounded-2xl p-6 text-center">
            <p className="kicker">{t('calculadoras.agua.tuObjetivo')}</p>
            <p className="stat-value text-4xl">
              {formatNumber(litros, lang)} L
            </p>
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted">
              <Droplets className="size-4 text-accent" aria-hidden />
              {t('calculadoras.agua.vasos', { vasos })}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted">
          {t('calculadoras.agua.disclaimer')}
        </p>
      </div>
    </div>
  )
}
