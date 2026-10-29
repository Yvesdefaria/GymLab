// F132.4: héroe de Objetivos. Destaca el próximo hito (menor ETA) con peso
// meta, recorrido, pista, ritmo y fecha; sin datos cae a estados honestos.
import { useTranslation } from 'react-i18next'
import { applyUnits, formatUnits, type Units } from '@/domain/settings'
import { goalProgressRatio, type GoalProjection } from '@/domain/goalProjection'
import { formatDate, formatNumber } from '@/lib/intl'
import { parseLocalDate } from '@/domain/dates'
import type { AppLanguage } from '@/domain/onboarding'
import { Button } from '@/components/ui/Button'

interface GoalHeroProps {
  goalsCount: number
  featured: GoalProjection | null
  allReached: boolean
  units: Units
  onAdd: () => void
}

export const GoalHero = ({ goalsCount, featured, allReached, units, onAdd }: GoalHeroProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const unit = formatUnits(units)
  // Todos los pesos visibles pasan por la unidad del usuario, redondeados a 1
  // decimal como formatWeight; en kg el texto es idéntico al de siempre.
  const fmtWeight = (kg: number) => formatNumber(Math.round(applyUnits(kg, units) * 10) / 10, lang)

  if (goalsCount === 0) {
    return (
      <section className="border-b border-border/40 pb-4 pt-2">
        <p className="kicker">{t('goals.title')}</p>
        <h2 className="mt-1 font-display text-[28px] font-light leading-tight text-fg">
          {t('goals.hero.emptyTitle')}
        </h2>
        <p className="mt-1 text-xs text-muted">{t('goalSetter.none')}</p>
        <Button variant="outline" size="md" className="mt-3 w-full" onClick={onAdd}>
          {t('goalSetter.add')}
        </Button>
      </section>
    )
  }

  if (allReached) {
    return (
      <section className="border-b border-border/40 pb-4 pt-2">
        <p className="kicker">{t('goals.title')}</p>
        <h2 className="mt-1 font-display text-[30px] font-light leading-tight text-success">
          {t('goals.hero.allReached', { count: goalsCount })}
        </h2>
      </section>
    )
  }

  if (!featured) {
    return (
      <section className="border-b border-border/40 pb-4 pt-2">
        <p className="kicker">{t('goals.title')}</p>
        <h2 className="mt-1 font-display text-[26px] font-light leading-tight text-fg">
          {t('goals.hero.noProjection')}
        </h2>
        <p className="mt-1 text-xs text-muted">{t('goals.hero.noProjectionHint')}</p>
      </section>
    )
  }

  const pct = goalProgressRatio(featured) * 100

  return (
    <section className="border-b border-border/40 pb-4 pt-2">
      <p className="kicker">
        {t('goals.hero.kicker', { exercise: featured.exerciseName })}
      </p>
      <div className="mt-1 flex items-baseline gap-1" data-testid="goal-hero-target">
        <strong className="font-display text-[44px] font-light leading-none tabular-nums text-fg">
          {fmtWeight(featured.targetE1rm)}
        </strong>
        <span className="text-sm text-muted"> {unit} e1RM</span>
      </div>
      <p className="mt-1 text-[12px] font-medium text-fg">
        {t('goals.current', {
          current: fmtWeight(featured.currentE1rm),
          target: fmtWeight(featured.targetE1rm),
          unit,
        })}
      </p>
      <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-border/30" aria-hidden>
        <div className="h-full rounded-full bg-cta" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-2 text-[10px]">
        <span className="text-muted">
          {featured.trend === 'up'
            ? t('goals.estimated', {
                weeks: featured.weeksToTarget,
                date: featured.estimatedDate
                  ? formatDate(parseLocalDate(featured.estimatedDate), lang, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '',
              })
            : t('goals.noProgress')}
        </span>
        <span className="font-semibold text-gold-bright">
          {featured.trend === 'up'
            ? t('goals.rate', { rate: fmtWeight(featured.weeklyImprovementRate), unit })
            : ''}
        </span>
      </div>
    </section>
  )
}

