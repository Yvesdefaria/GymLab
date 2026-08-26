import { Flame, TrendingUp } from 'lucide-react'
import { CountUp } from '@/components/ui/CountUp'
import { formatVolume } from '@/domain/volume'

interface StatsGridProps {
  streak: number
  weeklyVolumeValue: number
  t: any
}

export const StatsGrid = ({ streak, weeklyVolumeValue, t }: StatsGridProps) => (
  <div className="reveal reveal-1 grid grid-cols-2 gap-3">
    <div className="panel rounded-2xl p-4">
      <Flame className="mb-2 size-5 text-cta" aria-hidden />
      <p className="kicker">{t('home.racha')}</p>
      <p className="stat-value mt-1 text-3xl">
        {streak > 0 ? (
          <>
            <CountUp value={streak} />
            d
          </>
        ) : (
          '—'
        )}
      </p>
    </div>
    <div className="panel rounded-2xl p-4">
      <TrendingUp className="mb-2 size-5 text-success" aria-hidden />
      <p className="kicker">{t('home.volumenSem')}</p>
      <p className="stat-value mt-1 text-3xl">
        {weeklyVolumeValue > 0 ? formatVolume(weeklyVolumeValue) : '—'}
      </p>
    </div>
  </div>
)
