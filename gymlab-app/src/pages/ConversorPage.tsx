// Página «Conversor lb ↔ kg» (/calculadoras/conversor): convierte pesos de discos y ejercicios.
import { useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { kgToLb, lbToKg } from '@/domain/calculators/converter'
import { MAX_WEIGHT_KG } from '@/domain/calculators/plates'
import { formatNumber } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'

type Mode = 'kg-lb' | 'lb-kg'

// Conversor simple: el modo define unidad de origen/destino y el resultado se calcula al vuelo.
export const ConversorPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [mode, setMode] = useState<Mode>('kg-lb')
  const [value, setValue] = useState('')

  // Deriva unidades y resultado según el modo; sin input (num = 0) no se muestra resultado.
  const num = parseFloat(value) || 0
  const from = mode === 'kg-lb' ? 'kg' : 'lb'
  const to = mode === 'kg-lb' ? 'lb' : 'kg'
  const result = num > 0 ? (mode === 'kg-lb' ? kgToLb(num) : lbToKg(num)) : 0

  return (
    <div>
      <AppHeader title={t('calculadoras.conversor.titulo')} subtitle={t('calculadoras.conversor.subtitulo')} />
      <div className="space-y-4 p-4">
        <BackLink to="/calculadoras" />

        <div className="panel rounded-2xl p-4">
          <div className="mb-3 flex gap-2">
            <button
              onClick={() => setMode('kg-lb')}
              aria-pressed={mode === 'kg-lb'}
              className={`min-h-[44px] flex-1 rounded-xl text-sm font-medium transition-colors ${
                mode === 'kg-lb'
                  ? 'bg-cta text-on-gold'
                  : 'bg-bg text-muted hover:text-accent-soft'
              }`}
            >
              {t('calculadoras.conversor.modoKgLb')}
            </button>
            <button
              onClick={() => setMode('lb-kg')}
              aria-pressed={mode === 'lb-kg'}
              className={`min-h-[44px] flex-1 rounded-xl text-sm font-medium transition-colors ${
                mode === 'lb-kg'
                  ? 'bg-cta text-on-gold'
                  : 'bg-bg text-muted hover:text-accent-soft'
              }`}
            >
              {t('calculadoras.conversor.modoLbKg')}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">{t('calculadoras.conversor.cantidad', { unidad: from })}</label>
            <input
              type="number"
              min={0}
              max={MAX_WEIGHT_KG}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="100"
              inputMode="decimal"
              aria-label={t('calculadoras.conversor.cantidadAria', { unidad: from })}
              className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
            />
          </div>
        </div>

        {num > 0 && (
          <div className="panel rounded-2xl p-6 text-center">
            <p className="flex items-center justify-center gap-2 kicker">
              <ArrowRightLeft className="size-4 text-accent" aria-hidden />
              {t('calculadoras.conversor.resultado')}
            </p>
            <p className="stat-value text-4xl">
              {formatNumber(result, lang)} {to}
            </p>
            <p className="mt-2 text-xs text-muted">
              {t('calculadoras.conversor.igualdad', {
                num: formatNumber(num, lang),
                desde: from,
                result: formatNumber(result, lang),
                hasta: to,
              })}
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted">
          {t('calculadoras.conversor.nota')}
        </p>
      </div>
    </div>
  )
}
