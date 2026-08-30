// Logros extendidos: página de todos los logros (desbloqueados + pendientes).
import { useTranslation } from 'react-i18next'
import { Trophy, Footprints, Flame, Target, BarChart3, CalendarCheck, Repeat, Heart, Shuffle, TrendingUp, BookOpen, Medal, Calendar } from 'lucide-react'
import { ACHIEVEMENTS, type Achievement } from '@/domain/achievements'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'

const iconMap: Record<string, typeof Trophy> = {
  Footprints, Trophy, Flame, Target, BarChart3, CalendarCheck, Repeat,
  Heart, Shuffle, TrendingUp, BookOpen, Medal, Calendar, Crown: Trophy,
}

interface AchievementsPageProps {
  unlockedIds: string[]
}

export const AchievementsPage = ({ unlockedIds }: AchievementsPageProps) => {
  const { t } = useTranslation()

  const unlocked = ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id))
  const locked = ACHIEVEMENTS.filter((a) => !unlockedIds.includes(a.id))

  return (
    <div>
      <AppHeader title={t('achievements.title')} />
      <div className="flex flex-col gap-4 px-4 pb-20 pt-2">
        <div className="flex items-center justify-between">
          <BackLink to="/mas" />
          <span className="text-sm text-muted">
            {unlocked.length}/{ACHIEVEMENTS.length}
          </span>
        </div>

      {/* Desbloqueados */}
      {unlocked.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-fg">{t('achievements.unlocked')}</p>
          {unlocked.map((a) => (
            <AchievementCard key={a.id} achievement={a} unlocked />
          ))}
        </div>
      )}

      {/* Pendientes */}
      {locked.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-fg">{t('achievements.locked')}</p>
          {locked.map((a) => (
            <AchievementCard key={a.id} achievement={a} unlocked={false} />
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

const AchievementCard = ({ achievement, unlocked }: { achievement: Achievement; unlocked: boolean }) => {
  const { t } = useTranslation()
  const Icon = iconMap[achievement.icon] ?? Trophy

  return (
    <div className={`min-h-[52px] rounded-2xl border px-4 py-3 transition-colors ${
      unlocked
        ? 'border-accent/50 bg-accent/10'
        : 'border-border/30 bg-bg-elevated/30 opacity-50'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
          unlocked ? 'bg-accent/20' : 'bg-bg-elevated/50'
        }`}>
          <Icon className={`size-5 ${unlocked ? 'text-accent' : 'text-muted'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-fg">{t(achievement.titleKey as any)}</p>
          <p className="text-xs text-muted">{t(achievement.descriptionKey as any)}</p>
        </div>
        {unlocked && (
          <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-fg">
            ✓
          </span>
        )}
      </div>
    </div>
  )
}
