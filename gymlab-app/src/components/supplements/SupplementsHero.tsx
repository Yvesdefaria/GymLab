// Héroe de Suplementos (F132.6): adherencia de hoy con barra fina. El verde
// queda reservado a «cumplido»; pendiente se mantiene neutro.
import { useTranslation } from 'react-i18next'
import type { SupplementAdherence } from '@/domain/supplements'

export const SupplementsHero = ({ adherence }: { adherence: SupplementAdherence }) => {
  const { t } = useTranslation()
  const { taken, total, pending, ratio } = adherence
  if (total === 0) return null

  return (
    <section className="pt-4">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[52px] font-light leading-none tabular-nums text-fg">{taken}</span>
        <span className="text-base text-muted">{t('supplement.heroTotal', { total })}</span>
      </div>
      <p className={`mt-1 text-[11px] ${pending === 0 ? 'text-success' : 'text-muted'}`}>
        {pending === 0
          ? t('supplement.heroAllDone')
          : pending === 1
            ? t('supplement.heroPendingOne')
            : t('supplement.heroPending', { count: pending })}
      </p>
      <div
        role="progressbar"
        aria-valuenow={taken}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={t('supplement.progressAria', { taken, total })}
        className="mt-2.5 h-0.5 overflow-hidden bg-border/60"
      >
        <div className="h-full bg-cta" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
    </section>
  )
}
