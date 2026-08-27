// Página «Calendario» (/calendario): mes con los días entrenados y el programa/rutina activos.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { MonthCalendar } from '@/components/calendar/MonthCalendar'
import { trainedLocalDates } from '@/domain/calendar'
import { useWorkouts } from '@/hooks/useWorkouts'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { localizeRoutine } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'

// Calcula las fechas locales entrenadas (una vez, vía useMemo) y las pasa al calendario mensual.
export const CalendarioPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { workouts } = useWorkouts()
  const { program, routine } = useActiveProgram()

  const trained = useMemo(() => trainedLocalDates(workouts), [workouts])

  return (
    <div>
      <AppHeader
        title={t('calendario.titulo')}
        subtitle={routine ? t('calendario.programaActivo', { titulo: localizeRoutine(routine, lang).title }) : t('calendario.sinPrograma')}
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
