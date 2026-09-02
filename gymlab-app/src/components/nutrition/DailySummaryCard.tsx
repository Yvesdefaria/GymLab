// Resumen diario de calorías y macros: anillo de progreso de kcal + barras de macros con %.
import { useTranslation } from 'react-i18next'
import { calculateDailyTotals } from '@/domain/nutrition'
import type { I18nKey } from '@/i18n'

type DailyTotals = ReturnType<typeof calculateDailyTotals>

const MACROS: Array<{ key: I18nKey; value: (t: DailyTotals) => number }> = [
  { key: 'nutrition.protein', value: (t) => t.proteinG },
  { key: 'nutrition.carbs', value: (t) => t.carbsG },
  { key: 'nutrition.fat', value: (t) => t.fatG },
]

// Anillo de progreso simple en SVG (más ligero que una librería de gráficos para un solo valor).
const KcalRing = ({ kcal, tdee }: { kcal: number; tdee: number }) => {
  const pct = tdee > 0 ? Math.min(100, (kcal / tdee) * 100) : 0
  const R = 42
  const CIRC = 2 * Math.PI * R
  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeWidth="9" className="text-border/30" />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - pct / 100)}
          className="text-accent transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xl font-bold text-fg">{kcal}</p>
        <p className="text-xs text-muted">{pct.toFixed(0)}%</p>
      </div>
    </div>
  )
}

export const DailySummaryCard = ({ totals, tdee }: { totals: DailyTotals; tdee: number }) => {
  const { t } = useTranslation()
  const macroPct = (value: number) => (tdee > 0 ? Math.min(100, (value / tdee) * 100) : 0)
  return (
    <div className="rounded-2xl border border-border/30 bg-bg-elevated/30 px-4 py-4">
      <p className="text-sm font-semibold text-fg">{t('nutrition.dailySummary')}</p>
      <div className="mt-3 flex items-center gap-4">
        <KcalRing kcal={totals.kcal} tdee={tdee} />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-fg">{totals.kcal} kcal</p>
          <p className="text-xs text-muted">{t('nutrition.dailySummary')} · {tdee} kcal</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {MACROS.map((m) => {
          const value = m.value(totals)
          const pct = macroPct(value)
          return (
            <div key={m.key}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted">{t(m.key)}</span>
                <span className="text-fg">{value.toFixed(0)}g · {pct.toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-border/30">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
