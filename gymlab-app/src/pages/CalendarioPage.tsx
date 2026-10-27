// Página «Calendario» (/calendario): mes circular Nocturno + resumen de la semana.
// No comparte MonthCalendar con Inicio; Inicio usa WeekCalendar.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { MonthCalendar } from '@/components/calendar/MonthCalendar'
import { buildWeekGrid, trainedLocalDates, volumeByLocalDate } from '@/domain/calendar'
import { toLocalDateStr } from '@/domain/dates'
import { useWorkouts } from '@/hooks/useWorkouts'
import { useWorkoutVolumes } from '@/hooks/useWorkoutVolumes'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { localizeRoutine } from '@/i18n/catalog'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'

// Calcula las fechas y el volumen local (una vez, vía useMemo) y los pasa al calendario.
export const CalendarioPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { workouts } = useWorkouts()
  const volumes = useWorkoutVolumes()
  const { program, routine } = useActiveProgram()

  const trained = useMemo(() => trainedLocalDates(workouts), [workouts])
  const volumeByDate = useMemo(
    () => volumeByLocalDate(workouts, volumes),
    [workouts, volumes]
  )
  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    for (const date of trained) months.add(date.slice(0, 7))
    months.add(toLocalDateStr().slice(0, 7))
    return [...months].sort()
  }, [trained])

  const today = toLocalDateStr()
  const weekRows = useMemo(
    () =>
      buildWeekGrid(new Date(), trained, program ?? null, routine?.daysCount ?? 0).filter(
        (day) => day.status === 'done' || day.status === 'done-scheduled' || day.date === today
      ),
    [trained, program, routine, today]
  )

  return (
    <div>
      <AppHeader
        title={t('calendario.titulo')}
        subtitle={
          routine
            ? t('calendario.programaActivo', { titulo: localizeRoutine(routine, lang).title })
            : t('calendario.sinPrograma')
        }
      />
      <div className="space-y-4 p-4 pb-24">
        <BackLink to="/" />

        <MonthCalendar
          trained={trained}
          volumeByDate={volumeByDate}
          availableMonths={availableMonths}
          program={program ?? null}
          routineDaysCount={routine?.daysCount ?? 0}
        />

        <section data-testid="cal-week-list" className="border-t border-border/40 pt-4">
          <p className="kicker mb-2">{t('calendario.estaSemana')}</p>
          <div>
            {weekRows.map((day) => {
              const done = day.status === 'done' || day.status === 'done-scheduled'
              const main =
                day.routineDayIndex !== null
                  ? t('calendario.dia', { n: day.routineDayIndex + 1 })
                  : done
                    ? t('calendario.entrenado')
                    : t('calendario.descanso')
              const status = done
                ? t('calendario.hecho')
                : day.status === 'scheduled'
                  ? t('calendario.hoyProgramado')
                  : t('calendario.hoyDescanso')
              return (
                <div
                  key={day.date}
                  className="flex min-h-11 items-center gap-3 border-t border-border/40 first:border-t-0"
                >
                  <span className="w-14 shrink-0 text-[9px] font-medium uppercase tracking-[0.08em] text-gold-bright">
                    {formatDate(`${day.date}T12:00:00`, lang, {
                      weekday: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="min-w-0 flex-1 text-sm text-fg">{main}</span>
                  <span
                    className={`shrink-0 text-[8px] font-semibold uppercase tracking-[0.1em] ${
                      done ? 'text-muted' : 'text-gold-bright'
                    }`}
                  >
                    {status}
                  </span>
                </div>
              )
            })}
            {weekRows.length === 0 && (
              <p className="py-3 text-sm text-muted">{t('calendario.sinEntrenosSemana')}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
