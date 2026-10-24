// Héroe de /peso-corporal: último registro del rango, peso y delta contra el
// primer registro de la misma ventana. El verde no se usa: el delta es progreso (dorado).
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { StatsHero } from '@/components/stats/StatsHero'
import { applyUnits, formatUnits, type Units } from '@/domain/settings'
import { formatDate } from '@/lib/intl'
import type { StatsRange } from '@/domain/dates'
import type { BodyWeightEntry } from '@/domain/types'
import type { AppLanguage } from '@/domain/onboarding'

type Props = {
  latest: BodyWeightEntry | null
  deltaKg: number | null
  range: StatsRange
  units: Units
  today: string
  lang: AppLanguage
}

export const WeightHero = ({ latest, deltaKg, range, units, today, lang }: Props) => {
  const { t } = useTranslation()

  const dateLabel = latest
    ? latest.localDate === today
      ? t('peso.hoy')
      : formatDate(latest.localDate + 'T12:00:00', lang, { day: 'numeric', month: 'short' })
    : ''

  const rangeLabel =
    range === 30 ? t('peso.en30d') : range === 90 ? t('peso.en90d') : t('peso.desdeInicio')

  const deltaValue =
    deltaKg === null ? null : applyUnits(Math.abs(deltaKg), units).toFixed(1)

  return (
    <StatsHero
      eyebrow={latest ? `${t('peso.ultimoRegistro')} · ${dateLabel}` : t('peso.ultimoRegistro')}
      value={latest ? applyUnits(latest.weightKg, units).toFixed(1) : '—'}
      unit={latest ? formatUnits(units) : undefined}
      valueClassName="text-[58px]"
    >
      {latest && deltaKg !== null ? (
        deltaKg === 0 ? (
          <p className="mt-1 text-[11px] font-semibold text-muted">{t('peso.sinCambio')}</p>
        ) : (
          <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-gold-bright">
            {deltaKg < 0 ? (
              <ArrowDownRight className="size-3.5" aria-hidden />
            ) : (
              <ArrowUpRight className="size-3.5" aria-hidden />
            )}
            {deltaValue} {formatUnits(units)} <span className="font-normal text-muted">{rangeLabel}</span>
          </p>
        )
      ) : latest ? null : (
        <p className="mt-1 text-[11px] text-muted">{t('peso.sinDatosRango')}</p>
      )}
    </StatsHero>
  )
}
