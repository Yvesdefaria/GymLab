// StepAchievements: badges de los logros de pasos ya desbloqueados. El icono
// llega como nombre de string en la definición del logro y se resuelve aquí
// contra lucide-react; el título y la descripción salen de i18n.
import { useTranslation } from 'react-i18next'
import {
  Footprints,
  Target,
  Flame,
  Crown,
  TrendingUp,
  CalendarRange,
  Medal,
  Mountain,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import type { StepAchievementDef } from '@/domain/stepAchievements'
import type { I18nKey } from '@/i18n'

type StepAchievementsProps = {
  achievements: StepAchievementDef[]
}

const ICONS: Record<string, LucideIcon> = {
  Footprints,
  Target,
  Flame,
  Crown,
  TrendingUp,
  CalendarRange,
  Medal,
  Mountain,
}

export const StepAchievements = ({ achievements }: StepAchievementsProps) => {
  const { t } = useTranslation()

  return (
    <section className="panel rounded-2xl p-4" aria-label={t('steps.achievementsTitle')}>
      <h3 className="text-sm font-bold tracking-wide text-fg">{t('steps.achievementsTitle')}</h3>

      {achievements.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          {t('steps.achievementsEmpty')}{' '}
          <span className="text-muted/70">{t('steps.achievementsEmptyText')}</span>
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {achievements.map((achievement) => {
            const Icon = ICONS[achievement.icon] ?? Trophy
            return (
              <li
                key={achievement.id}
                className="flex items-start gap-2 rounded-2xl border border-gold/20 bg-bg-elevated/50 p-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  {/* El dominio tipa titleKey como string; t() exige literales del schema. */}
                  <span className="block text-xs font-semibold leading-tight text-fg">
                    {t(achievement.titleKey as I18nKey)}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-tight text-muted">
                    {t(achievement.descriptionKey as I18nKey)}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}