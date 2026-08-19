// Comparación de sesiones: selector de dos sesiones y vista lado a lado con deltas.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { Workout } from '@/domain/types'

interface SessionComparisonProps {
  workouts: Workout[]
}

const formatDelta = (current: number, previous: number, unit: string): string => {
  const delta = current - previous
  if (delta === 0) return `0 ${unit}`
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)} ${unit}`
}

const DeltaIcon = ({ current, previous, inverse = false }: { current: number; previous: number; inverse?: boolean }) => {
  if (current === previous) return <Minus className="size-3 text-muted" />
  const better = inverse ? current < previous : current > previous
  return better
    ? <TrendingUp className="size-3 text-accent" />
    : <TrendingDown className="size-3 text-red-400" />
}

export const SessionComparison = ({ workouts }: SessionComparisonProps) => {
  const { t } = useTranslation()
  const [selectedA, setSelectedA] = useState<number | null>(workouts[0]?.id ?? null)
  const [selectedB, setSelectedB] = useState<number | null>(workouts[1]?.id ?? null)

  const workoutA = workouts.find((w) => w.id === selectedA)
  const workoutB = workouts.find((w) => w.id === selectedB)

  const formatDuration = (start: string, end: string | null): string => {
    if (!end) return '—'
    const ms = new Date(end).getTime() - new Date(start).getTime()
    const min = Math.round(ms / 60000)
    return `${min} min`
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <ArrowLeftRight className="size-4 text-accent" aria-hidden />
        <p className="kicker">{t('compare.title')}</p>
      </div>

      {/* Selectores */}
      <div className="flex gap-2">
        <select
          value={selectedA ?? ''}
          onChange={(e) => setSelectedA(Number(e.target.value))}
          className="flex-1 rounded-lg border border-border/30 bg-bg-elevated/30 px-2 py-1.5 text-[0.65rem] text-fg"
        >
          {workouts.map((w) => (
            <option key={w.id} value={w.id}>{w.localDate}</option>
          ))}
        </select>
        <select
          value={selectedB ?? ''}
          onChange={(e) => setSelectedB(Number(e.target.value))}
          className="flex-1 rounded-lg border border-border/30 bg-bg-elevated/30 px-2 py-1.5 text-[0.65rem] text-fg"
        >
          {workouts.map((w) => (
            <option key={w.id} value={w.id}>{w.localDate}</option>
          ))}
        </select>
      </div>

      {/* Vista lado a lado */}
      {workoutA && workoutB ? (
        <div className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2.5">
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Headers */}
            <p className="text-[0.55rem] text-muted">{t('compare.metric')}</p>
            <p className="text-[0.55rem] text-muted">{workoutA.localDate}</p>
            <p className="text-[0.55rem] text-muted">{workoutB.localDate}</p>

            {/* Fecha */}
            <p className="text-[0.6rem] font-medium text-fg">{t('compare.date')}</p>
            <p className="text-[0.6rem] text-muted">{workoutA.localDate}</p>
            <p className="text-[0.6rem] text-muted">{workoutB.localDate}</p>

            {/* Duración */}
            <p className="text-[0.6rem] font-medium text-fg">{t('compare.duration')}</p>
            <p className="text-[0.6rem] text-muted">{formatDuration(workoutA.startedAt, workoutA.finishedAt)}</p>
            <p className="text-[0.6rem] text-muted">{formatDuration(workoutB.startedAt, workoutB.finishedAt)}</p>

            {/* Volumen */}
            <p className="text-[0.6rem] font-medium text-fg">{t('compare.volume')}</p>
            <p className="text-[0.6rem] text-muted">{workoutA.totalVolume.toFixed(0)} kg</p>
            <div className="flex items-center justify-center gap-1">
              <p className="text-[0.6rem] text-muted">{workoutB.totalVolume.toFixed(0)} kg</p>
              <DeltaIcon current={workoutB.totalVolume} previous={workoutA.totalVolume} />
            </div>

            {/* Delta */}
            <p className="text-[0.6rem] font-medium text-fg">{t('compare.delta')}</p>
            <p className="text-[0.6rem] text-muted">—</p>
            <p className={`text-[0.6rem] font-medium ${
              workoutB.totalVolume > workoutA.totalVolume
                ? 'text-accent'
                : workoutB.totalVolume < workoutA.totalVolume
                  ? 'text-red-400'
                  : 'text-muted'
            }`}>
              {formatDelta(workoutB.totalVolume, workoutA.totalVolume, 'kg')}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-4 text-center">
          <p className="text-[0.65rem] text-muted">{t('compare.selectTwo')}</p>
        </div>
      )}
    </div>
  )
}
