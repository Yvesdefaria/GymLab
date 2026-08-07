import { useMemo } from 'react'
import { CandlestickChart, type CandleDatum } from './CandlestickChart'
import { buildVolumeRangeSeries } from '@/domain/trainingStats'
import { formatVolume } from '@/domain/volume'
import type { Workout } from '@/domain/types'

type Props = {
  workouts: Workout[]
}

const weekLabel = (week: string): string =>
  new Date(week + 'T12:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })

export const VolumeRangeCandlestick = ({ workouts }: Props) => {
  const data = useMemo<CandleDatum[]>(
    () => buildVolumeRangeSeries(workouts).map((p) => ({ ...p, label: weekLabel(p.week) })),
    [workouts],
  )

  return (
    <CandlestickChart
      data={data}
      ariaLabel="Rango de volumen por semana"
      emptyText="Aún no hay sesiones registradas."
      formatValue={formatVolume}
    />
  )
}
