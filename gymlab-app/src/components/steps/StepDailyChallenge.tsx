// Reto diario de /pasos (dirección C): fila hairline, barra fina y progreso
// contra la meta real del usuario (no un 10k fijo).
import { useTranslation } from 'react-i18next'
import type { AppLanguage } from '@/domain/onboarding'
import { getDailyStepChallenge } from '@/domain/challenges'
import { clampPercent } from '@/domain/numberGuard'
import { formatStepNumber } from '@/lib/intl'

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
      className="border-t border-border/40 pt-4"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t('steps.dailyChallenge.title')}
        </p>
        <span
          className={`text-[10px] tabular-nums ${
            progress.completed ? 'text-success' : 'text-gold'
          }`}
        >
          {Math.round(pct)}%
        </span>
      </div>
      <p className="mt-1 text-[10px] text-muted">
        {t('steps.dailyChallenge.desc', {
          goal: formatStepNumber(progress.target, lang),
        })}
      </p>

      <div
        role="progressbar"
        aria-label={t('steps.dailyChallenge.title')}
        aria-valuenow={progress.current}
        aria-valuemin={0}
        aria-valuemax={progress.target}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-fg/10"
      >
        <div
          className={`h-full rounded-full ${
            progress.completed
              ? 'bg-success'
              : 'bg-gradient-to-r from-gold to-gold-bright'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-1.5 text-[10px] text-muted">
        {progress.completed
          ? t('steps.dailyChallenge.completed')
          : t('steps.dailyChallenge.progress', {
              current: formatStepNumber(progress.current, lang),
              goal: formatStepNumber(progress.target, lang),
            })}
      </p>
    </section>
  )
}
