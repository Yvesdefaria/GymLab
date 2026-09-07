// StepHeatmap: heatmap mensual con intensidad de color según el % de la meta
// cumplida. Cada día es un botón accesible (aria-label con fecha y pasos) y al
// tocarlo se muestra un caption con el detalle; fuera del mes las celdas van
// vacías para conservar el alineado de la semana.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChartCard } from '../stats/ChartCard'
import { toLocalDateStr } from '@/domain/dates'
import type { StepHeatLevel } from '@/domain/stepsTracker'
import type { DailyStepsEntry } from '@/domain/types'
import { formatDate, formatDayShort, formatNumber, weekdayLetters } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import { buildHeatmapGrid, type HeatCell } from './stepSeries'

type StepHeatmapProps = {
  month: DailyStepsEntry[]
  heatmap: Record<string, StepHeatLevel>
}

const LEVEL_BG: Record<StepHeatLevel, string> = {
  0: 'bg-bg-elevated',
  1: 'bg-gold/20',
  2: 'bg-gold/40',
  3: 'bg-gold/60',
  4: 'bg-gold',
}

export const StepHeatmap = ({ month, heatmap }: StepHeatmapProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage

  const today = toLocalDateStr()
  const monthKey = today.slice(0, 7)
  const cells = buildHeatmapGrid(monthKey, month, heatmap)
  const hasActivity = month.some((e) => e.steps > 0)
  const [selected, setSelected] = useState<string | null>(null)

  const monthTitle = formatDate(`${monthKey}-01T12:00:00`, lang, {
    month: 'long',
    year: 'numeric',
  })

  // Detalle de un día concreto: fecha + pasos, o "sin pasos" si no tiene registro.
  const describeCell = (cell: HeatCell): string =>
    cell.steps > 0
      ? t('steps.heatmapDay', {
          date: formatDayShort(cell.date, lang),
          count: formatNumber(cell.steps, lang),
        })
      : t('steps.heatmapNoData')

  if (!hasActivity) {
    return (
      <ChartCard title={t('steps.heatmapLabel')} subtitle={monthTitle}>
        <p className="py-4 text-center text-sm text-muted">{t('steps.heatmapEmpty')}</p>
      </ChartCard>
    )
  }

  const selectedCell = cells.find((c) => c.date === selected)

  return (
    <ChartCard
      title={t('steps.heatmapLabel')}
      subtitle={monthTitle}
      footer={
        <div className="space-y-2">
          <p className="min-h-4 text-xs font-medium text-fg" aria-live="polite">
            {selectedCell ? describeCell(selectedCell) : t('steps.heatmapHint')}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-muted">
            <span>{t('steps.heatmapLess')}</span>
            {([1, 2, 3, 4] as const).map((level) => (
              <span key={level} className={`size-2.5 rounded-sm ${LEVEL_BG[level]}`} aria-hidden />
            ))}
            <span>{t('steps.heatmapMore')}</span>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase text-muted">
          {weekdayLetters(lang, 1).map((letter, i) => (
            <span key={`${letter}-${i}`}>{letter}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            if (!cell.inMonth) {
              return <span key={cell.date} aria-hidden className="aspect-square w-full" />
            }
            const isToday = cell.date === today
            const isSelected = cell.date === selected
            return (
              <button
                key={cell.date}
                type="button"
                aria-label={describeCell(cell)}
                aria-pressed={isSelected}
                onClick={() => setSelected(isSelected ? null : cell.date)}
                className={`aspect-square w-full rounded-lg ${LEVEL_BG[cell.level]} transition-colors ${isToday ? 'ring-1 ring-cta' : ''} ${isSelected ? 'ring-2 ring-fg' : ''}`}
              />
            )
          })}
        </div>
      </div>
    </ChartCard>
  )
}