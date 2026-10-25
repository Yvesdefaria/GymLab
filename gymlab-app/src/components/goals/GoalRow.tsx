// F132.4: fila de un objetivo. Existe para todo objetivo del store, tenga o no
// proyección; el botón completo abre el sheet de edición.
import { useTranslation } from 'react-i18next'
import { CheckCircle, Pencil } from 'lucide-react'
import { applyUnits, formatUnits, type Units } from '@/domain/settings'
import { goalProgressRatio, type GoalRow as GoalRowModel } from '@/domain/goalProjection'
import { formatDate, formatNumber } from '@/lib/intl'
import { parseLocalDate } from '@/domain/dates'
import type { AppLanguage } from '@/domain/onboarding'

interface GoalRowProps {
  row: GoalRowModel
  units: Units
  onEdit: () => void
}

export const GoalRow = ({ row, units, onEdit }: GoalRowProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const unit = formatUnits(units)
  const fmt = (kg: number) => formatNumber(Math.round(applyUnits(kg, units) * 10) / 10, lang)
  const projection = row.projection

  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={t('goals.rows.editAria', { exercise: row.exerciseName })}
      className="min-h-[64px] w-full border-b border-border/40 py-3 text-left last:border-b-0"
    >
      <span className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-fg">
          {row.exerciseName}
        </span>
        <span className="text-[11px] tabular-nums text-muted">
          {fmt(row.targetE1rm)} {unit} e1RM
        </span>
        <Pencil className="size-3.5 shrink-0 text-muted" aria-hidden />
      </span>

      {projection?.reached ? (
        <span className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-success">
          <CheckCircle className="size-3.5" aria-hidden />
          {t('goals.reached', { target: fmt(projection.targetE1rm), unit })}
        </span>
      ) : projection ? (
        <>
          <span className="mt-1 block text-[11px] text-fg">
            {t('goals.current', {
              current: fmt(projection.currentE1rm),
              target: fmt(projection.targetE1rm),
              unit,
            })}
          </span>
          <span className="mt-1 block h-[2px] overflow-hidden rounded-full bg-border/30" aria-hidden>
            <span
              className="block h-full rounded-full bg-cta"
              style={{ width: `${goalProgressRatio(projection) * 100}%` }}
            />
          </span>
          <span className="mt-1 flex items-baseline justify-between gap-2 text-[10px] text-muted">
            <span>
              {t('goals.estimated', {
                weeks: projection.weeksToTarget,
                date: projection.estimatedDate
                  ? formatDate(parseLocalDate(projection.estimatedDate), lang, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '',
              })}
            </span>
            <span className="font-semibold text-gold-bright">
              {t('goals.rate', { rate: fmt(projection.weeklyImprovementRate), unit })}
            </span>
          </span>
        </>
      ) : (
        <span className="mt-1 block text-[11px] text-muted">{t('goals.rows.noRecent')}</span>
      )}
    </button>
  )
}
