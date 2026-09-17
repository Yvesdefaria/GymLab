// Retos dinámicos adaptativos: muestra retos activos y disponibles con progreso visual.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trophy, Target, Flame, Calendar, TrendingUp } from 'lucide-react'
import { getAvailableChallenges, calculateProgress, defaultChallengeTab, type Challenge, type ChallengeProgress, type ChallengeStats, type ChallengeDuration, type ChallengeTab } from '@/domain/challenges'
import { TabNav } from '@/components/ui/TabNav'
import type { Level } from '@/domain/types'

const challengeIcon: Record<string, typeof Trophy> = {
  frecuencia: Flame,
  volumen: TrendingUp,
  pr: Target,
  consistencia: Calendar,
}

interface DynamicChallengesProps {
  level: Level
  statsByDuration: Record<ChallengeDuration, ChallengeStats>
}

export const DynamicChallenges = ({ level, statsByDuration }: DynamicChallengesProps) => {
  const { t } = useTranslation()
  // null = todavía no eligió: el tab se deriva y se adapta a los conteos.
  const [pickedTab, setPickedTab] = useState<ChallengeTab | null>(null)
  const available = getAvailableChallenges(level)

  const getProgressForChallenge = (c: Challenge): ChallengeProgress => {
    const s = statsByDuration[c.duration]
    switch (c.type) {
      case 'frecuencia': return calculateProgress(c, s.sessionsCount)
      case 'volumen': return calculateProgress(c, s.setsCount)
      case 'pr': return calculateProgress(c, s.prsCount)
      case 'consistencia': return calculateProgress(c, s.consecutiveWeeks)
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

  const activeCount = activeChallenges.length + completedChallenges.length
  const availableCount = unstartedChallenges.length
  // Sin elección del usuario el tab es reactivo; una vez elegido, su elección manda.
  const tab = pickedTab ?? defaultChallengeTab(activeCount, availableCount)

  const displayChallenges = tab === 'active'
    ? [...activeChallenges, ...completedChallenges]
    : unstartedChallenges

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Trophy className="size-4 text-accent" aria-hidden />
        <p className="kicker">{t('challenge.title')}</p>
      </div>

      <TabNav
        ariaLabel={t('challenge.title')}
        tabs={[
          { id: 'active', label: `${t('challenge.active')} (${activeCount})` },
          { id: 'available', label: `${t('challenge.available')} (${availableCount})` },
        ]}
        active={tab}
        onChange={(id) => setPickedTab(id as ChallengeTab)}
      >
        {/* Lista de retos */}
        {displayChallenges.length === 0 ? (
          <div className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-4 text-center">
            <p className="text-[0.65rem] text-muted">
              {tab === 'active' ? t('challenge.noneActive') : t('challenge.noneAvailable')}
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
                        {t(c.titleKey as any)}
                      </p>
                      <p className="text-[0.55rem] text-muted truncate">
                        {t(c.descriptionKey as any)}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[0.55rem] text-muted">
                          {progress.current}/{progress.target} {t(c.unitKey as any)}
                        </p>
                        <span className="shrink-0 rounded-full border border-border/40 px-1.5 py-0.5 text-[0.55rem] text-muted">
                          {t(`challenge.duration.${c.duration}` as any)}
                        </span>
                      </div>
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
      </TabNav>
    </div>
  )
}
