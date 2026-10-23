// Calendario de actividad mensual de /pasos (dirección C): celdas circulares con
// intensidad dorada, estrella verde cuando se cumple la meta y navegación solo
// hacia meses anteriores con datos. En el mes vigente la flecha derecha se
// deshabilita; en un mes pasado vuelve al siguiente mes con datos.
import { memo, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import type { AppLanguage } from '@/domain/onboarding'
import type { DailyStepsEntry } from '@/domain/types'
import {
  getAdjacentMonthKey,
  getDaysWithData,
  currentMonthKey,
} from '@/domain/stepAnalytics'
import { getMonthlyHeatmap, type StepHeatLevel } from '@/domain/stepsTracker'
import { formatDate, formatDayShort, formatStepNumber, weekdayLetters } from '@/lib/intl'
import { buildHeatmapGrid, type HeatCell } from './stepSeries'

type StepActivityCalendarProps = {
  monthKey: string
  entries: DailyStepsEntry[]
  goal: number
  today: string
  monthsWithData: string[]
  onMonthChange: (monthKey: string) => void
}

const LEVEL_BG: Record<StepHeatLevel, string> = {
  0: 'bg-fg/5',
  1: 'bg-gold/10',
  2: 'bg-gold/25',
  3: 'bg-gold/45',
  4: 'bg-gold/70',
}

export const StepActivityCalendar = memo(function StepActivityCalendar({
  monthKey,
  entries,
  goal,
  today,
  monthsWithData,
  onMonthChange,
}: StepActivityCalendarProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [selected, setSelected] = useState<string | null>(null)

  const current = currentMonthKey(today)
  const prev = getAdjacentMonthKey(monthsWithData, monthKey, -1)
  const next = getAdjacentMonthKey(monthsWithData, monthKey, 1)
  const daysWithData = getDaysWithData(entries)

  const heatmap = useMemo(() => getMonthlyHeatmap(entries, goal), [entries, goal])
  const cells = useMemo(
    () => buildHeatmapGrid(monthKey, entries, heatmap),
    [monthKey, entries, heatmap],
  )
  const selectedCell = cells.find((cell) => cell.date === selected)
  const rawTitle = formatDate(`${monthKey}-01T12:00:00`, lang, {
    month: 'long',
    year: 'numeric',
  })
  const monthTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1)

  useEffect(() => {
    setSelected(null)
  }, [monthKey])

  const dayLabel = (cell: HeatCell): string => {
    const base =
      cell.steps > 0
        ? t('steps.heatmapDay', {
            date: formatDayShort(cell.date, lang),
            count: formatStepNumber(cell.steps, lang),
          })
        : `${formatDayShort(cell.date, lang)}: ${t('steps.heatmapNoData')}`
    return goal > 0 && cell.steps >= goal
      ? `${base}, ${t('steps.calendarGoalMet')}`
      : base
  }

  return (
    <section
      className="border-t border-border/40 pt-4"
      aria-label={t('steps.heatmapLabel')}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => prev && onMonthChange(prev)}
          disabled={!prev}
          aria-label={t('steps.calendarPrev')}
          className="flex size-11 items-center justify-center rounded-full text-gold disabled:opacity-25"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>

        <div className="flex min-w-0 flex-col items-center leading-tight">
          <strong className="truncate font-display text-sm font-normal text-fg">
            {monthTitle}
          </strong>
          <span className="text-[9px] text-muted">
            {monthKey === current
              ? t('steps.calendarSub', { count: daysWithData })
              : t('steps.calendarSubPast', { count: daysWithData })}
          </span>
        </div>

        <button
          type="button"
          onClick={() => next && onMonthChange(next)}
          disabled={!next}
          aria-label={t('steps.calendarNext')}
          className="flex size-11 items-center justify-center rounded-full text-gold disabled:opacity-25"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[8.5px] uppercase tracking-[0.08em] text-muted">
        {weekdayLetters(lang, 1).map((letter, index) => (
          <span key={`${letter}-${index}`}>{letter}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          if (!cell.inMonth) {
            return <span key={cell.date} aria-hidden className="aspect-square" />
          }

          const met = goal > 0 && cell.steps >= goal
          const isToday = cell.date === today
          const isSelected = cell.date === selected
          const background = met ? 'bg-success/15' : LEVEL_BG[cell.level]
          const ring = isSelected
            ? 'ring-2 ring-fg'
            : isToday
              ? 'ring-1 ring-gold'
              : ''

          return (
            <button
              key={cell.date}
              type="button"
              aria-label={dayLabel(cell)}
              aria-pressed={isSelected}
              onClick={() => setSelected(isSelected ? null : cell.date)}
              className={`relative aspect-square rounded-full text-[9px] tabular-nums text-fg ${background} ${ring}`}
            >
              {Number(cell.date.slice(8, 10))}
              {met ? (
                <Star
                  className="absolute bottom-0.5 right-0.5 size-2.5 fill-success text-success"
                  aria-hidden
                />
              ) : null}
            </button>
          )
        })}
      </div>

      {daysWithData === 0 ? (
        <p className="mt-2 text-center text-[10px] text-muted">{t('steps.heatmapEmpty')}</p>
      ) : null}

      <div className="mt-2 flex items-center justify-between gap-2 text-[9px] text-muted">
        <div className="flex items-center gap-1">
          <span>{t('steps.heatmapLess')}</span>
          {([1, 2, 3, 4] as const).map((level) => (
            <span
              key={level}
              className={`size-2 rounded-full ${LEVEL_BG[level]}`}
              aria-hidden
            />
          ))}
          <span>{t('steps.heatmapMore')}</span>
        </div>
        <span className="flex items-center gap-1">
          <Star className="size-2.5 fill-success text-success" aria-hidden />
          {t('steps.calendarGoalMet')}
        </span>
      </div>

      <p className="mt-2 min-h-4 text-[10px] font-medium text-fg" aria-live="polite">
        {selectedCell ? dayLabel(selectedCell) : t('steps.heatmapHint')}
      </p>
    </section>
  )
})
