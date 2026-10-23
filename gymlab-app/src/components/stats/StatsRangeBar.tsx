// Barra de rango única de Stats C1: reemplaza los chips por sección del mockup.
import { RangePills } from './RangePills'
import { useStatsRange } from './StatsRangeContext'

export const StatsRangeBar = () => {
  const { range, setRange } = useStatsRange()

  return (
    <div className="flex items-center justify-start">
      <RangePills value={range} onChange={setRange} />
    </div>
  )
}
