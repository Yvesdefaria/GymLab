// Héroe de /pasos (dirección C): anillo único, pasos de hoy, link para editar la
// meta y tiempo caminando estimado. El cálculo vive en domain/stepAnalytics.
import { useTranslation } from 'react-i18next'
import { StepCircularProgress } from './StepCircularProgress'
import { estimateWalkingMinutes } from '@/domain/stepAnalytics'
import type { AppLanguage } from '@/domain/onboarding'
import { formatDurationMinutes, formatStepNumber } from '@/lib/intl'

type StepHeroProps = {
  steps: number
  goal: number
  onEditGoal: () => void
}

export const StepHero = ({ steps, goal, onEditGoal }: StepHeroProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const walking = formatDurationMinutes(estimateWalkingMinutes(steps))

  return (
    <section className="flex flex-col items-center border-b border-border/40 pb-5 pt-3">
      <StepCircularProgress steps={steps} goal={goal} />

      <button
        type="button"
        onClick={onEditGoal}
        className="mt-2 flex min-h-11 items-center px-1"
      >
        <span className="border-b border-gold/35 pb-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-gold">
          {t('steps.goalEdit', { goal: formatStepNumber(goal, lang) })}
        </span>
      </button>

      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-3xl font-light text-gold-bright">{walking}</span>
        <span className="text-[10px] uppercase tracking-[0.12em] text-muted">
          {t('steps.walking')}
        </span>
        <span className="rounded border border-border/40 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-muted">
          {t('steps.walkingEstimate')}
        </span>
      </div>
    </section>
  )
}
