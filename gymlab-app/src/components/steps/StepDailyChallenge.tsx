// StepDailyChallenge: tarjeta del reto diario «Camina 10k» (F84e). Solo
// presentación: el progreso llega calculado from domain (getDailyStepChallenge).
import { useTranslation } from 'react-i18next'
import { Footprints } from 'lucide-react'
import type { AppLanguage } from '@/domain/onboarding'
import { getDailyStepChallenge } from '@/domain/challenges'
import { clampPercent } from '@/domain/numberGuard'
import { formatNumber } from '@/lib/intl'

type StepDailyChallengeProps = {
  steps: number
  goal: number
}

export const StepDailyChallenge = ({ steps, goal }: StepDailyChallengeProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage

  const progress = getDailyStepChallenge(steps, goal)
  const pct = progress.target > 0 ? clampPercent((progress.current / progress.target) * 100) : 0

  return (
    <section
      aria-label={t('steps.dailyChallenge.title')}
      className={`rounded-2xl border p-4 transition-colors ${
        progress.completed ? 'border-accent/50 bg-accent/10' : 'border-border/30 bg-bg-elevated/30'
      }`}
    >
      <div className="flex min-h-11 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
          <Footprints className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">{t('steps.dailyChallenge.title')}</p>
          <p className="text-xs text-muted">{t('steps.dailyChallenge.desc')}</p>
        </div>
        {progress.completed && (
          <span className="shrink-0 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold text-accent">
            {t('steps.dailyChallenge.completed')}
          </span>
        )}
      </div>

      <div
        role="progressbar"
        aria-label={t('steps.dailyChallenge.title')}
        aria-valuenow={progress.current}
        aria-valuemin={0}
        aria-valuemax={progress.target}
        className="mt-3 h-2 overflow-hidden rounded-full bg-border/30"
      >
        <div
          className="h-full rounded-full bg-cta transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted">
        {t('steps.dailyChallenge.progress', {
          current: formatNumber(progress.current, lang),
          goal: formatNumber(progress.target, lang),
        })}
      </p>
    </section>
  )
}