// Resumen diario de calorías y macros: barra de progreso contra el TDEE + grid de macros.
import { useTranslation } from 'react-i18next'
import { calculateDailyTotals } from '@/domain/nutrition'

type DailyTotals = ReturnType<typeof calculateDailyTotals>

export const DailySummaryCard = ({ totals, tdee }: { totals: DailyTotals; tdee: number }) => {
  const { t } = useTranslation()
  const kcalPct = tdee > 0 ? Math.min(100, (totals.kcal / tdee) * 100) : 0
  return (
    <div className="rounded-2xl border border-border/30 bg-bg-elevated/30 px-4 py-4">
      <p className="text-sm font-semibold text-fg">{t('nutrition.dailySummary')}</p>
      <div className="mt-3 h-3 w-full rounded-full bg-border/30 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${kcalPct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{totals.kcal} / {tdee} kcal</span>
        <span>{kcalPct.toFixed(0)}%</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-muted">{t('nutrition.protein')}</p>
          <p className="text-sm font-semibold text-fg">{totals.proteinG.toFixed(0)}g</p>
        </div>
        <div>
          <p className="text-xs text-muted">{t('nutrition.carbs')}</p>
          <p className="text-sm font-semibold text-fg">{totals.carbsG.toFixed(0)}g</p>
        </div>
        <div>
          <p className="text-xs text-muted">{t('nutrition.fat')}</p>
          <p className="text-sm font-semibold text-fg">{totals.fatG.toFixed(0)}g</p>
        </div>
      </div>
    </div>
  )
}