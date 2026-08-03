import { useEffect, useState } from 'react'
import { db } from '@/data/repositories/dexie/db'
import { seedExercises } from '@/data/seed/exercises'
import { seedRoutines, seedRoutineDays, seedRoutineItems } from '@/data/seed/routines'
import { seedPapers } from '@/data/seed/papers'

const seed = async () => {
  const exerciseCount = await db.exercises.count()
  if (exerciseCount > 0) return

  await db.exercises.bulkAdd(seedExercises)
  await db.routines.bulkAdd(seedRoutines)
  await db.routineDays.bulkAdd(seedRoutineDays)
  await db.routineItems.bulkAdd(seedRoutineItems)
  await db.papers.bulkAdd(seedPapers)
}

type ProvidersProps = {
  children: React.ReactNode
}

export const Providers = ({ children }: ProvidersProps) => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    seed().then(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <div className="text-center">
          <div className="mb-3 inline-block size-8 animate-spin rounded-full border-2 border-border border-t-cta" />
          <p className="text-sm text-muted">Cargando GymLab...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
