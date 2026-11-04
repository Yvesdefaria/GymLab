// F137 — Mapa de volumen (variante A): 12 grupos, banda semanal, directas/efectivas
// y hasta tres señales accionables. Sin tarjetas: hairline, kicker y un solo acento.
import { Fragment, useState } from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { formatNumber } from '@/lib/intl'
import { InfoTip } from '@/components/ui/InfoTip'
import type { AppLanguage } from '@/domain/onboarding'
import type { VolumeGroup } from '@/domain/volumeGroup'
import type { VolumeGroupStat } from '@/domain/volumeModel'
import type { RepDistribution, VolumeSignal, WeeklyConsistency } from '@/domain/volumeSignals'
import type { VolumeRange } from '@/hooks/useMuscleVolume'

interface Props {
  range: VolumeRange
  onRangeChange: (range: VolumeRange) => void
  stats: VolumeGroupStat[]
  signals: VolumeSignal[]
  weekly: Partial<Record<VolumeGroup, WeeklyConsistency>>
  reps: Partial<Record<VolumeGroup, RepDistribution>>
  partial: boolean
}

const RANGE_OPTIONS: VolumeRange[] = [7, 28]

// Los tres grupos que no existen en `muscle.*` usan su propia etiqueta.
const GROUP_LABEL_KEY: Partial<Record<VolumeGroup, string>> = {
  cuadriceps: 'volume.quads',
  isquios: 'volume.hamstrings',
  gemelos: 'volume.calves',
}

const groupLabel = (t: TFunction, group: VolumeGroup): string =>
  t((GROUP_LABEL_KEY[group] ?? `muscle.${group}`) as never)

export const MuscleVolumeView = ({ range, onRangeChange, stats, signals, weekly, reps, partial }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [expanded, setExpanded] = useState<VolumeGroup | null>(null)

  const signalText = (signal: VolumeSignal): string => {
    switch (signal.kind) {
      case 'deficit':
        return t('volume.deficit', {
          gap: signal.gap,
          group: groupLabel(t, signal.group),
        })
      case 'abandoned':
        return t('volume.abandoned', {
          group: groupLabel(t, signal.group),
          days: signal.daysAgo,
        })
      case 'antagonist':
        return t('volume.antagonist', {
          stronger: groupLabel(t, signal.stronger),
          weaker: groupLabel(t, signal.weaker),
          ratio: formatNumber(signal.ratio, lang, { maximumFractionDigits: 1 }),
        })
    }
  }

  return (
    <div className="flex flex-col gap-3" data-tour="stats-frequency">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="kicker">{t('volume.kicker')}</p>
            <InfoTip id="frecuencia" />
          </div>
          <p className="font-display text-lg font-medium tracking-wide text-fg">
            {t('volume.title', { days: range })}
          </p>
        </div>
        <div
          role="group"
          aria-label={t('volume.rangeAria')}
          className="flex items-center rounded-full border border-border/50 p-0.5"
        >
          {RANGE_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={range === value}
              onClick={() => onRangeChange(value)}
              className={`min-h-[36px] rounded-full px-3 text-[11px] font-semibold tabular-nums transition-colors ${
                range === value ? 'bg-cta/15 text-gold-bright' : 'text-muted'
              }`}
            >
              {t(value === 7 ? 'volume.range7' : 'volume.range28')}
            </button>
          ))}
        </div>
      </div>

      {signals.length > 0 && (
        <div className="flex flex-col">
          {signals.map((signal) => (
            <div
              key={`${signal.kind}-${'group' in signal ? signal.group : signal.pair}`}
              className="flex items-start gap-2 border-t border-border/40 py-2 text-xs leading-relaxed text-fg"
            >
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
              <span>{signalText(signal)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4">
        {stats.map((stat) => {
          const band = stat.target
          const scaleMax = Math.max(band.max * 1.25, stat.weekly, 1)
          const bandLeft = (band.min / scaleMax) * 100
          const bandWidth = ((band.max - band.min) / scaleMax) * 100
          const marker = Math.min(100, (stat.weekly / scaleMax) * 100)
          const muted =
            stat.state === 'sin-datos' ||
            stat.state === 'datos-parciales' ||
            stat.state === 'sin-clasificar'
          const warn = stat.state === 'bajo' || stat.state === 'alto'
          const value =
            stat.state === 'sin-datos'
              ? '—'
              : formatNumber(stat.weekly, lang, { maximumFractionDigits: 1 })
          const meta =
            stat.state === 'sin-datos'
              ? t('volume.noData')
              : stat.state === 'datos-parciales'
                ? t('volume.partial')
                : stat.state === 'sin-clasificar'
                  ? t('volume.unclassified')
                  : `${band.min}–${band.max}`

          const week = weekly[stat.group]
          const rep = reps[stat.group]
          const maxWeekly = Math.max(1, ...(week?.weeks ?? [1]))

          return (
            <Fragment key={stat.group}>
              <button
                type="button"
                onClick={() => setExpanded(expanded === stat.group ? null : stat.group)}
                aria-expanded={expanded === stat.group}
                className="w-full border-t border-border/40 py-2.5 text-left"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-fg">{groupLabel(t, stat.group)}</p>
                  <p
                    className={`font-display text-lg tabular-nums ${
                      warn ? 'text-warning' : muted ? 'text-muted' : 'text-fg'
                    }`}
                  >
                    {value}
                  </p>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-fg/10" aria-hidden>
                  <div className="relative h-full w-full">
                    <span
                      className="absolute inset-y-0 rounded-full bg-cta/20"
                      style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
                    />
                    <span
                      className="absolute -top-1 h-3.5 w-0.5 rounded-full bg-cta"
                      style={{ left: `${Math.min(99, marker)}%` }}
                    />
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-[10px] tabular-nums text-muted">
                    {meta}
                    {stat.effective > stat.direct
                      ? ` · ${formatNumber(stat.effective, lang, { maximumFractionDigits: 1 })} ${t('volume.effective')}`
                      : ''}
                  </p>
                  {stat.alert ? (
                    <AlertTriangle className="size-3.5 text-warning" aria-hidden />
                  ) : stat.state === 'dentro' ? (
                    <CheckCircle className="size-3.5 text-success" aria-hidden />
                  ) : null}
                </div>
              </button>
              {expanded === stat.group && (
                <div className="col-span-2 -mt-2 mb-1 border-t border-border/40 pt-2">
                  <div className="flex items-end gap-1" aria-hidden>
                    {(week?.weeks ?? []).map((value, index) => (
                      <span
                        key={index}
                        className="w-2.5 rounded-sm bg-cta/50"
                        style={{ height: `${Math.max(3, (value / maxWeekly) * 20)}px` }}
                      />
                    ))}
                    <span className="ml-2 text-[10px] text-muted">{t('volume.weeks')}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted">
                    <span>{t('volume.reps')} · 1–5 / 6–15 / 16+</span>
                    <span className="tabular-nums">
                      {rep ? `${rep.strength} / ${rep.hypertrophy} / ${rep.endurance}` : '—'}
                    </span>
                  </div>
                </div>
              )}
            </Fragment>
          )
        })}
      </div>

      <p className="text-[10px] leading-relaxed text-muted">
        {t('volume.legend')}
        {partial ? ` · ${t('volume.partialNote')}` : ''}
      </p>
    </div>
  )
}
