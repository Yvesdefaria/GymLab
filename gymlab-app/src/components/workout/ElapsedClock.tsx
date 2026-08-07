import { useEffect, useState } from 'react'
import { formatElapsedClock } from '@/domain/workouts'

type ElapsedClockProps = {
  startedAt: string | null
}

export const ElapsedClock = ({ startedAt }: ElapsedClockProps) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!startedAt) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [startedAt])

  if (!startedAt) return null

  return (
    <p className="stat-value mt-0.5 text-2xl tabular-nums">
      {formatElapsedClock((now - new Date(startedAt).getTime()) / 1000)}
    </p>
  )
}
