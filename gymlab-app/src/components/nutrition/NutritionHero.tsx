// Héroe de Nutrición (F132.6): anillo de kcal con el objetivo real (TDEE + pasos)
// y reparto de macros sobre las kcal consumidas. Sin objetivo no inventa una meta.
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { calculateMacroShares } from '@/domain/nutrition'
import type { AppLanguage } from '@/domain/onboarding'
import type { I18nKey } from '@/i18n'
import { formatNumber } from '@/lib/intl'

type Totals = { kcal: number; proteinG: number; carbsG: number; fatG: number }

const RING_R = 52
const RING_C = 2 * Math.PI * RING_R

const MacroCell = ({
  labelKey,
  grams,
  pct,
  lang,
}: {
  labelKey: I18nKey
  grams: number
  pct: number | null
  lang: AppLanguage
}) => {
  const { t } = useTranslation()
  return (
    <div className="min-w-0" data-macro={labelKey}>
      <p className="text-[8.5px] font-semibold uppercase tracking-[0.16em] text-muted">{t(labelKey)}</p>
      <p className="mt-0.5 font-display text-xl font-light tabular-nums text-fg">
        {formatNumber(grams, lang, { maximumFractionDigits: 1 })}
        <span className="ml-0.5 text-[9px] font-normal text-muted">g</span>
      </p>
      <div className="mt-1.5 h-0.5 overflow-hidden bg-border/60" aria-hidden>
        <div className="h-full bg-cta" style={{ width: `${pct ?? 0}%` }} />
      </div>
      <p className="mt-1 text-[9px] tabular-nums text-muted/80">
        {pct == null ? t('nutrition.macroShareEmpty') : t('nutrition.macroShare', { pct })}
      </p>
    </div>
  )
}

export const NutritionHero = ({ totals, goal }: { totals: Totals; goal?: number }) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const hasGoal = goal != null && goal > 0
  const pct = hasGoal ? Math.min(100, (totals.kcal / goal) * 100) : 0
  const reached = hasGoal && totals.kcal >= goal
  const difference = hasGoal ? Math.abs(goal - totals.kcal) : 0
  const shares = calculateMacroShares(totals)
  const hasEnergy = totals.proteinG + totals.carbsG + totals.fatG > 0
  const macroPct = (value: number) => (hasEnergy ? value : null)

  return (
    <section className="pt-3">
      <div className="flex items-center gap-4">
        <div
          role={hasGoal ? 'progressbar' : undefined}
          aria-valuenow={hasGoal ? totals.kcal : undefined}
          aria-valuemin={hasGoal ? 0 : undefined}
          aria-valuemax={hasGoal ? goal : undefined}
          aria-label={
            hasGoal
              ? t('nutrition.kcalAria', {
                  consumed: formatNumber(totals.kcal, lang),
                  goal: formatNumber(goal, lang),
                })
              : t('nutrition.kcalAriaNoGoal', { consumed: formatNumber(totals.kcal, lang) })
          }
          className="relative size-[142px] shrink-0"
        >
          <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
            <circle cx="60" cy="60" r={RING_R} fill="none" strokeWidth="8" className="stroke-border/60" />
            {hasGoal && (
              <circle
                cx="60"
                cy="60"
                r={RING_R}
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - pct / 100)}
                className={reached ? 'stroke-success transition-all duration-500' : 'stroke-cta transition-all duration-500'}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="font-display text-3xl font-light tabular-nums text-fg">
              {formatNumber(totals.kcal, lang)}
            </span>
            <span className="text-[9.5px] text-muted">
              {hasGoal
                ? t('nutrition.ofGoal', { goal: formatNumber(goal, lang) })
                : t('nutrition.kcalUnit')}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cta">
            {t('nutrition.consumedToday')}
          </p>
          {hasGoal ? (
            <>
              {difference === 0 ? (
                <p data-testid="nutrition-reached" className="mt-1.5 text-[12.5px] text-success">
                  {t('nutrition.goalReached')}
                </p>
              ) : (
                <p
                  data-testid={reached ? 'nutrition-over' : 'nutrition-remaining'}
                  className={`mt-1.5 text-[12.5px] ${reached ? 'text-success' : 'text-muted'}`}
                >
                  <span className="mr-1 font-display text-xl font-light tabular-nums text-fg">
                    {formatNumber(difference, lang)}
                  </span>{' '}
                  {reached ? t('nutrition.overUnit') : t('nutrition.remainingUnit')}
                </p>
              )}
              <p className="mt-1 text-[10px] leading-snug text-muted/70">{t('nutrition.goalNote')}</p>
            </>
          ) : (
            <>
              <p className="mt-1.5 text-[13px] font-medium text-fg">{t('nutrition.goalMissingTitle')}</p>
              <p className="mt-1 text-[10.5px] leading-snug text-muted">{t('nutrition.goalMissingText')}</p>
              <Link
                to="/perfil"
                className="mt-2 inline-flex min-h-[44px] items-center text-[11px] font-semibold text-cta"
              >
                {t('nutrition.goalMissingCta')}
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-border/40 pt-2.5">
        <MacroCell labelKey="nutrition.protein" grams={totals.proteinG} pct={macroPct(shares.proteinPct)} lang={lang} />
        <MacroCell labelKey="nutrition.carbs" grams={totals.carbsG} pct={macroPct(shares.carbsPct)} lang={lang} />
        <MacroCell labelKey="nutrition.fat" grams={totals.fatG} pct={macroPct(shares.fatPct)} lang={lang} />
      </div>
    </section>
  )
}
