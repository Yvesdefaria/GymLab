// Logros extendidos: página de todos los logros (desbloqueados + pendientes).
import { useTranslation } from 'react-i18next'
import { Trophy, Footprints, Flame, Target, BarChart3, CalendarCheck, Repeat, Heart, Shuffle, TrendingUp, BookOpen, Medal, Calendar } from 'lucide-react'
import { ACHIEVEMENTS, type Achievement } from '@/domain/achievements'

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
    <div className="flex flex-col gap-4 px-4 pb-20 pt-2">
      <div className="flex items-center gap-2">
        <Trophy className="size-5 text-accent" aria-hidden />
        <h1 className="text-lg font-bold text-fg">{t('achievements.title')}</h1>
        <span className="ml-auto text-[0.6rem] text-muted">
          {unlocked.length}/{ACHIEVEMENTS.length}
        </span>
      </div>

      {/* Desbloqueados */}
      {unlocked.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-fg">{t('achievements.unlocked')}</p>
          {unlocked.map((a) => (
            <AchievementCard key={a.id} achievement={a} unlocked />
          ))}
        </div>
      )}

      {/* Pendientes */}
      {locked.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-fg">{t('achievements.locked')}</p>
          {locked.map((a) => (
            <AchievementCard key={a.id} achievement={a} unlocked={false} />
          ))}
        </div>
      )}
    </div>
  )
}

const AchievementCard = ({ achievement, unlocked }: { achievement: Achievement; unlocked: boolean }) => {
  const Icon = iconMap[achievement.icon] ?? Trophy

  return (
    <div className={`rounded-xl border px-3 py-2.5 transition-colors ${
      unlocked
        ? 'border-accent/50 bg-accent/10'
        : 'border-border/30 bg-bg-elevated/30 opacity-50'
    }`}>
      <div className="flex items-center gap-2.5">
        <div className={`flex size-8 items-center justify-center rounded-lg ${
          unlocked ? 'bg-accent/20' : 'bg-bg-elevated/50'
        }`}>
          <Icon className={`size-4 ${unlocked ? 'text-accent' : 'text-muted'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[0.65rem] font-semibold text-fg">{achievement.title}</p>
          <p className="text-[0.55rem] text-muted">{achievement.description}</p>
        </div>
        {unlocked && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-[0.5rem] font-bold text-accent-fg">
            ✓
          </span>
        )}
      </div>
    </div>
  )
}
