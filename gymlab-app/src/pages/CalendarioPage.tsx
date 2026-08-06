import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { MonthCalendar } from '@/components/calendar/MonthCalendar'
import { activeProgramRepo, routineRepo, workoutRepo } from '@/data/repositories'
import { trainedLocalDates } from '@/domain/calendar'

export const CalendarioPage = () => {
  const workouts = useLiveQuery(() => workoutRepo.getAll(), []) ?? []
  const program = useLiveQuery(() => activeProgramRepo.get(), [])
  const routine = useLiveQuery(
    () =>
      program
        ? routineRepo.getAll().then((rs) => rs.find((r) => r.id === program.routineId))
        : undefined,
    [program]
  )

  const trained = useMemo(() => trainedLocalDates(workouts), [workouts])

  return (
    <div>
      <AppHeader
        title="Calendario"
        subtitle={routine ? `Programa: ${routine.title}` : 'Sin programa activo'}
      />
      <div className="space-y-4 p-4">
        <BackLink to="/" />

        <MonthCalendar
          trained={trained}
          program={program ?? null}
          routineDaysCount={routine?.daysCount ?? 0}
        />
      </div>
    </div>
  )
}
