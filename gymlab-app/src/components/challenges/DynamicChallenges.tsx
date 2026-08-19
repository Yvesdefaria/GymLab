// Retos dinámicos adaptativos: muestra retos activos y disponibles con progreso visual.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trophy, Target, Flame, Calendar, TrendingUp } from 'lucide-react'
import { getAvailableChallenges, calculateProgress, type Challenge, type ChallengeProgress } from '@/domain/challenges'
import type { Level } from '@/domain/types'

const challengeIcon: Record<string, typeof Trophy> = {
  frecuencia: Flame,
  volumen: TrendingUp,
  pr: Target,
  consistencia: Calendar,
}

interface DynamicChallengesProps {
  level: Level
  stats: {
    sessionsThisWeek: number
    totalSeriesThisWeek: number
    prsThisWeek: number
    consecutiveWeeks: number
  }
}

export const DynamicChallenges = ({ level, stats }: DynamicChallengesProps) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'active' | 'available'>('active')
  const available = getAvailableChallenges(level)

  // Simula progreso para cada reto.
  const getProgressForChallenge = (c: Challenge): ChallengeProgress => {
    switch (c.type) {
      case 'frecuencia': return calculateProgress(c, stats.sessionsThisWeek)
      case 'volumen': return calculateProgress(c, stats.totalSeriesThisWeek)
      case 'pr': return calculateProgress(c, stats.prsThisWeek)
      case 'consistencia': return calculateProgress(c, stats.consecutiveWeeks)
      default: return calculateProgress(c, 0)
    }
  }

  const activeChallenges = available.filter((c) => {
    const p = getProgressForChallenge(c)
    return p.current > 0 && !p.completed
  })

  const completedChallenges = available.filter((c) => getProgressForChallenge(c).completed)
  const unstartedChallenges = available.filter((c) => {
    const p = getProgressForChallenge(c)
    return p.current === 0 && !p.completed
  })

  const displayChallenges = activeTab === 'active'
    ? [...activeChallenges, ...completedChallenges]
    : unstartedChallenges

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Trophy className="size-4 text-accent" aria-hidden />
        <p className="kicker">{t('challenge.title')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 rounded-lg px-2 py-1 text-[0.65rem] font-medium transition-colors ${
            activeTab === 'active'
              ? 'bg-accent text-accent-fg'
              : 'bg-bg-elevated/50 text-muted'
          }`}
        >
          {t('challenge.active')} ({activeChallenges.length + completedChallenges.length})
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 rounded-lg px-2 py-1 text-[0.65rem] font-medium transition-colors ${
            activeTab === 'available'
              ? 'bg-accent text-accent-fg'
              : 'bg-bg-elevated/50 text-muted'
          }`}
        >
          {t('challenge.available')} ({unstartedChallenges.length})
        </button>
      </div>

      {/* Lista de retos */}
      {displayChallenges.length === 0 ? (
        <div className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-4 text-center">
          <p className="text-[0.65rem] text-muted">
            {activeTab === 'active' ? t('challenge.noneActive') : t('challenge.noneAvailable')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {displayChallenges.map((c) => {
            const progress = getProgressForChallenge(c)
            const pct = progress.target > 0 ? (progress.current / progress.target) * 100 : 0
            const Icon = challengeIcon[c.type] ?? Target

            return (
              <div
                key={c.id}
                className={`rounded-xl border px-3 py-2.5 transition-colors ${
                  progress.completed
                    ? 'border-accent/50 bg-accent/10'
                    : 'border-border/30 bg-bg-elevated/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="size-3.5 text-accent" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.65rem] font-semibold text-fg truncate">
                      {c.type === 'frecuencia' ? t('challenge.freq3.title') : c.type === 'volumen' ? t('challenge.vol20.title') : c.type === 'pr' ? t('challenge.pr1.title') : t('challenge.cons4.title')}
                    </p>
                    <p className="text-[0.55rem] text-muted">
                      {progress.current}/{progress.target} {c.unit}
                    </p>
                  </div>
                  {progress.completed && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[0.55rem] font-bold text-accent-fg">
                      {t('challenge.done')}
                    </span>
                  )}
                </div>
                {/* Barra de progreso */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-border/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
