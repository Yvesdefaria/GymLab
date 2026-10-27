// Progreso semanal de la home: volumen de la semana + barras de las últimas 5 semanas.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { buildWeeklyVolumeSeries } from '@/domain/weeklyVolume'
import type { VolumeByWorkout } from '@/domain/volume'
import { formatDayShort, formatNumber } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { WeeklySummary } from '@/domain/weeklySummary'
import type { Workout } from '@/domain/types'

type Props = {
  workouts: Workout[]
  volumes: VolumeByWorkout
  summary: WeeklySummary | null
  units: string
}

// Micro-gráfica editorial: sin ejes, sin grilla, sin tooltip. El número da la
// escala y las barras solo muestran el ritmo de las últimas semanas.
export const HomeProgress = ({ workouts, volumes, summary, units }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage

  const series = useMemo(
    () => buildWeeklyVolumeSeries(workouts, volumes, 5),
    [workouts, volumes]
  )
  const current = series.at(-1)?.volume ?? 0
  const previous = series.at(-2)?.volume ?? 0

  if (series.every((point) => point.volume === 0)) return null

  const pct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null
  const deltaText =
    pct === null
      ? null
      : pct > 0
        ? t('home.deltaUp', { pct })
        : pct < 0
          ? t('home.deltaDown', { pct: Math.abs(pct) })
          : t('home.deltaStable')

  const max = Math.max(...series.map((point) => point.volume), 1)
  const meta = [
    summary && summary.prCount > 0
      ? `${summary.prCount} ${summary.prCount === 1 ? t('challenge.unit.pr') : t('weekly.prs')}`
      : null,
    summary?.bestDay
      ? `${t('weekly.bestDay')}: ${formatDayShort(summary.bestDay, lang)}`
      : null,
  ].filter(Boolean)

  return (
    <section className="mt-5 border-t border-border/40 pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.19em] text-muted">
          {t('progress.title')}
        </h2>
        <span className="text-[9px] text-muted">{t('home.progresoUltimasSemanas')}</span>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <strong className="font-display text-[1.7rem] font-light leading-none tabular-nums text-fg">
          {formatNumber(current, lang)}
          <span className="ml-1 font-sans text-[10px] font-medium text-muted"> {units}</span>
        </strong>
        {deltaText && (
          <span className={`text-[10px] font-medium ${pct && pct > 0 ? 'text-gold-bright' : 'text-muted'}`}>
            {deltaText}
          </span>
        )}
      </div>

      <div
        className="mt-3.5 flex h-[74px] items-end gap-1.5"
        role="img"
        aria-label={t('home.progresoAria', { volume: formatNumber(current, lang), units })}
      >
        {series.map((point, index) => (
          <div key={point.weekStart} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <div
              className={`w-full max-w-[22px] rounded-t-[6px] ${
                point.isCurrent
                  ? 'bg-gradient-to-t from-gold-bright/45 to-gold-bright'
                  : 'bg-gradient-to-t from-gold/35 to-gold/85'
              }`}
              style={{ height: `${(point.volume / max) * 100}%` }}
            />
            <span className="text-[7.5px] text-muted/65">
              {t('home.semanaAbrev')}
              {index + 1}
            </span>
          </div>
        ))}
      </div>

      {meta.length > 0 && (
        <p className="mt-2 text-[9px] text-muted">{meta.join(' · ')}</p>
      )}
    </section>
  )
}
