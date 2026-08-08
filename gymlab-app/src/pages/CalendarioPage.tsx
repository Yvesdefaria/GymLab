// Página «Calendario» (/calendario): mes con los días entrenados y el programa/rutina activos.
import { useMemo } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { MonthCalendar } from '@/components/calendar/MonthCalendar'
import { trainedLocalDates } from '@/domain/calendar'
import { useWorkouts } from '@/hooks/useWorkouts'
import { useActiveProgram } from '@/hooks/useActiveProgram'

// Calcula las fechas locales entrenadas (una vez, vía useMemo) y las pasa al calendario mensual.
export const CalendarioPage = () => {
  const { workouts } = useWorkouts()
  const { program, routine } = useActiveProgram()

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
