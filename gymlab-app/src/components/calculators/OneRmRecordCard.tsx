// Tarjeta «Tu récord» de la calculadora de 1RM: muestra el PR guardado del
// ejercicio y, si hay una estimación nueva, compara récord vs estimación
// (superado / no superado + diferencia en kg).
import { useTranslation } from 'react-i18next'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { compareOneRepMax } from '@/domain/calculators/oneRepMax'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { PRRecord } from '@/domain/types'

export const OneRmRecordCard = ({
  pr,
  estimateKg,
  lang,
}: {
  pr: PRRecord
  estimateKg: number | null
  lang: AppLanguage
}) => {
  const { t } = useTranslation()

  const comparison =
    estimateKg != null && estimateKg > 0 ? compareOneRepMax(pr.estimated1RM, estimateKg) : null
  const superado = comparison?.superado ?? false
  const diff = comparison ? Math.abs(comparison.diferenciaKg) : 0

  const Comparador = superado ? TrendingUp : comparison ? TrendingDown : Minus

  return (
    <section
      className={`rounded-2xl border p-4 ${
        superado ? 'border-cta/50 bg-cta/10' : 'border-gold/40 bg-cta/5'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2">
          <Trophy className="size-4 text-accent" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t('calculadoras.oneRm.tuRecord')}
          </span>
        </p>
        <span className="chip">
          {formatDate(pr.date, lang, { day: 'numeric', month: 'short' })}
        </span>
      </div>
      <p className="mt-1.5 stat-value text-2xl">
        {pr.estimated1RM} kg
        <span className="ml-1.5 text-xs font-normal text-muted">
          {t('calculadoras.oneRm.recordOrigen', {
            peso: pr.weightKg,
            reps: pr.reps,
          })}
        </span>
      </p>

      {comparison && (
        <p
          className={`mt-2 flex items-center gap-1.5 text-sm font-medium ${
            superado ? 'text-cta' : 'text-muted'
          }`}
        >
          <Comparador className="size-4" aria-hidden />
          {superado
            ? t('calculadoras.oneRm.recordSuperado', { diferencia: diff })
            : t('calculadoras.oneRm.recordNoSuperado', { diferencia: diff })}
        </p>
      )}
    </section>
  )
}