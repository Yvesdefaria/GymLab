// Retos dinámicos en filas hairline: conserva tabs y progreso, sin tarjetas 2×2.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, Flame, Footprints, HeartPulse, Target, TrendingUp, Trophy } from 'lucide-react'
import {
  calculateProgress,
  currentForChallenge,
  defaultChallengeTab,
  getAvailableChallenges,
  type Challenge,
  type ChallengeDuration,
  type ChallengeProgress,
  type ChallengeStats,
  type ChallengeTab,
} from '@/domain/challenges'
import { TabNav } from '@/components/ui/TabNav'
import type { Level } from '@/domain/types'

const challengeIcon: Record<string, typeof Trophy> = {
  frecuencia: Flame,
  volumen: TrendingUp,
  pr: Target,
  consistencia: Calendar,
  pasos: Footprints,
  cardio: HeartPulse,
}

interface DynamicChallengesProps {
  level: Level
  statsByDuration: Record<ChallengeDuration, ChallengeStats>
}

export const DynamicChallenges = ({ level, statsByDuration }: DynamicChallengesProps) => {
  const { t } = useTranslation()
  const [pickedTab, setPickedTab] = useState<ChallengeTab | null>(null)

  const available = getAvailableChallenges(level)
  const getProgressForChallenge = (challenge: Challenge): ChallengeProgress =>
    calculateProgress(challenge, currentForChallenge(challenge, statsByDuration[challenge.duration]))

  const activeChallenges = available.filter((challenge) => {
    const progress = getProgressForChallenge(challenge)
    return progress.current > 0 && !progress.completed
  })
  const completedChallenges = available.filter((challenge) => getProgressForChallenge(challenge).completed)
  const unstartedChallenges = available.filter((challenge) => {
    const progress = getProgressForChallenge(challenge)
    return progress.current === 0 && !progress.completed
  })

  const activeCount = activeChallenges.length + completedChallenges.length
  const availableCount = unstartedChallenges.length
  const tab = pickedTab ?? defaultChallengeTab(activeCount, availableCount)
  const displayChallenges =
    tab === 'active' ? [...activeChallenges, ...completedChallenges] : unstartedChallenges

  if (available.length === 0) return null

  return (
    <section className="mt-6 border-t border-border/40 pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.19em] text-muted">
          <Trophy className="size-3.5 text-gold" aria-hidden="true" />
          {t('challenge.title')}
        </h2>
        <span className="text-[9px] text-muted">
          {activeCount}/{available.length}
        </span>
      </div>

      <TabNav
        ariaLabel={t('challenge.title')}
        variant="compact"
        tabs={[
          { id: 'active', label: `${t('challenge.active')} (${activeCount})` },
          { id: 'available', label: `${t('challenge.available')} (${availableCount})` },
        ]}
        active={tab}
        onChange={(id) => setPickedTab(id as ChallengeTab)}
      >
        {displayChallenges.length === 0 ? (
          <p className="py-3 text-[10px] text-muted">
            {tab === 'active' ? t('challenge.noneActive') : t('challenge.noneAvailable')}
          </p>
        ) : (
          <div>
            {displayChallenges.map((challenge) => {
              const progress = getProgressForChallenge(challenge)
              const pct = progress.target > 0 ? (progress.current / progress.target) * 100 : 0
              const Icon = challengeIcon[challenge.type] ?? Target

              return (
                <div key={challenge.id} className="border-t border-border/40 py-2.5">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`size-3.5 shrink-0 ${progress.completed ? 'text-success' : 'text-gold'}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[11px] font-medium text-fg">
                          {t(challenge.titleKey as any)}
                        </p>
                        <span className="shrink-0 text-[9px] tabular-nums text-muted">
                          {progress.current}/{progress.target} {t(challenge.unitKey as any)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className="truncate text-[9px] text-muted">
                          {t(challenge.descriptionKey as any)}
                        </p>
                        <span className="shrink-0 rounded-full border border-border/40 px-1.5 py-0.5 text-[8px] text-muted">
                          {t(`challenge.duration.${challenge.duration}` as any)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-fg/10">
                        <div
                          className={`h-full rounded-full ${progress.completed ? 'bg-success' : 'bg-gold'}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </TabNav>
    </section>
  )
}
