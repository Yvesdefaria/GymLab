// Logros extendidos: página de todos los logros (desbloqueados + pendientes)
// como galería de chapas-medalla con metal por tier y contador de veces conseguido.
import { useTranslation } from 'react-i18next'
import { ACHIEVEMENTS, type Achievement } from '@/domain/achievements'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { AchievementMedal } from '@/components/achievements/AchievementMedal'

interface AchievementsPageProps {
  unlockedIds: string[]
  counts: Record<string, number>
}

export const AchievementsPage = ({ unlockedIds, counts }: AchievementsPageProps) => {
  const { t } = useTranslation()

  const unlocked = ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id))
  const locked = ACHIEVEMENTS.filter((a) => !unlockedIds.includes(a.id))

  return (
    <div>
      <AppHeader title={t('achievements.title')} />
      <div className="overflow-hidden px-4 pb-20 pt-2">
        <div className="flex items-center justify-between">
          <BackLink to="/mas" />
          <span className="text-sm text-muted">
            {unlocked.length}/{ACHIEVEMENTS.length}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {/* Desbloqueados */}
          {unlocked.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-fg">{t('achievements.unlocked')}</p>
              {unlocked.map((a) => (
                <AchievementCard
                  key={a.id}
                  achievement={a}
                  unlocked
                  count={counts[a.id] ?? 0}
                />
              ))}
            </div>
          )}

          {/* Pendientes */}
          {locked.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-fg">{t('achievements.locked')}</p>
              {locked.map((a) => (
                <AchievementCard key={a.id} achievement={a} unlocked={false} count={0} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const AchievementCard = ({
  achievement,
  unlocked,
  count,
}: {
  achievement: Achievement
  unlocked: boolean
  count: number
}) => {
  const { t } = useTranslation()

  return (
    <div className={`rounded-2xl border px-4 py-3 transition-colors ${
      unlocked
        ? 'border-accent/50 bg-accent/10'
        : 'border-border/30 bg-bg-elevated/30 opacity-50'
    }`}>
      <div className="flex items-center gap-3">
        <AchievementMedal achievement={achievement} unlocked={unlocked} count={count} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">{t(achievement.titleKey as any)}</p>
          <p className="text-xs text-muted">{t(achievement.descriptionKey as any)}</p>
        </div>
      </div>
    </div>
  )
}