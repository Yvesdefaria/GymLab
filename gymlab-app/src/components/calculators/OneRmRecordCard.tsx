// «Tu récord» de la calculadora de 1RM: PR guardado y comparación con la estimación nueva.
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
    <section className="border-t border-border/40 pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          <Trophy className="size-3.5 text-gold" aria-hidden />
          {t('calculadoras.oneRm.tuRecord')}
        </p>
        <span className="text-[9.5px] text-muted">
          {formatDate(pr.date, lang, { day: 'numeric', month: 'short' })}
        </span>
      </div>
      <p className="mt-1 flex items-baseline gap-1.5">
        <strong className="font-display text-2xl font-light tabular-nums text-fg">
          {pr.estimated1RM} kg
        </strong>
        <span className="text-[10.5px] text-muted">
          {t('calculadoras.oneRm.recordOrigen', { peso: pr.weightKg, reps: pr.reps })}
        </span>
      </p>

      {comparison && (
        <p
          className={`mt-2 flex items-center gap-1.5 text-[11.5px] font-medium ${
            superado ? 'text-gold-bright' : 'text-muted'
          }`}
        >
          <Comparador className="size-3.5" aria-hidden />
          {superado
            ? t('calculadoras.oneRm.recordSuperado', { diferencia: diff })
            : t('calculadoras.oneRm.recordNoSuperado', { diferencia: diff })}
        </p>
      )}
    </section>
  )
}
