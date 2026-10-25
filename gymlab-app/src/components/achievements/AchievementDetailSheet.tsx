// F132.4: detalle de un logro en bottom sheet (solo lectura). El metal, el
// estado y la variante viajan en el subtítulo; la barra es informativa y no
// duplica el contrato data-progress de la tarjeta.
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { AchievementMedal } from './AchievementMedal'
import { ACHIEVEMENT_TIERS, type Achievement } from '@/domain/achievements'
import type { AchievementProgress } from '@/domain/achievementProgress'
import type { AppLanguage } from '@/domain/onboarding'
import { formatNumber } from '@/lib/intl'

interface AchievementDetailSheetProps {
  achievement: Achievement
  unlocked: boolean
  count: number
  progress?: AchievementProgress
  variant?: string
  lang: AppLanguage
  onClose: () => void
}

export const AchievementDetailSheet = ({
  achievement,
  unlocked,
  count,
  progress,
  variant,
  lang,
  onClose,
}: AchievementDetailSheetProps) => {
  const { t } = useTranslation()
  const tier = ACHIEVEMENT_TIERS[achievement.id] ?? 'bronze'
  const state = unlocked
    ? t('achievements.metal.chapaDesbloqueada')
    : t('achievements.metal.chapaBloqueada')
  const variantLabel = variant ? t(`achievements.collectibles.${variant}` as never) : null
  const subtitle = [t(`achievements.tier.${tier}` as never), state, variantLabel]
    .filter(Boolean)
    .join(' · ')
  const hasProgress = progress !== undefined && progress.target > 0
  const pct = hasProgress ? Math.min(100, (progress.current / progress.target) * 100) : 0

  return (
    <BottomSheet
      title={t(achievement.titleKey as never)}
      subtitle={subtitle}
      onClose={onClose}
    >
      <div className="mt-3 flex items-start gap-3">
        <AchievementMedal achievement={achievement} unlocked={unlocked} count={0} variant={variant} />
        <p className="mt-1 text-sm text-muted">{t(achievement.descriptionKey as never)}</p>
      </div>

      {achievement.conditionKey && (
        <div className="mt-3 border-t border-border/40 pt-2">
          <p className="kicker">{t('achievements.detail.condition')}</p>
          <p className="mt-1 text-xs text-fg">{t(achievement.conditionKey as never)}</p>
        </div>
      )}

      {hasProgress && (
        <div className="mt-3 border-t border-border/40 pt-2">
          <div className="h-[2px] overflow-hidden rounded-full bg-border/30" aria-hidden>
            <div className="h-full rounded-full bg-cta" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted">
            {t('achievements.progress.count', {
              current: formatNumber(progress.current, lang),
              target: formatNumber(progress.target, lang),
            })}
          </p>
        </div>
      )}

      {count > 0 && (
        <p className="mt-2 text-xs text-gold-bright">
          {t('achievements.metal.vecesConseguido', { count })}
        </p>
      )}

      <Button variant="outline" size="md" className="mt-4 w-full" onClick={onClose}>
        {t('layout.confirm.close')}
      </Button>
    </BottomSheet>
  )
}
