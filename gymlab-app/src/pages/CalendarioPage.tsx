import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppHeader } from '@/components/layout/AppHeader'
import { activeProgramRepo, routineRepo, workoutRepo } from '@/data/repositories'
import { buildMonthGrid, trainedLocalDates } from '@/domain/calendar'
import { toLocalDateStr } from '@/domain/dates'

const statusClass: Record<string, string> = {
  rest: 'bg-bg text-muted border-border/40',
  scheduled: 'bg-cta/15 text-accent-soft border-cta/50',
  done: 'bg-success/20 text-success border-success/50',
  'done-scheduled': 'bg-success/30 text-success border-cta',
}

export const CalendarioPage = () => {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const workouts = useLiveQuery(() => workoutRepo.getAll(), []) ?? []
  const program = useLiveQuery(() => activeProgramRepo.get(), [])
  const routine = useLiveQuery(
    () => (program ? routineRepo.getAll().then((rs) => rs.find((r) => r.id === program.routineId)) : undefined),
    [program]
  )

  const trained = useMemo(() => trainedLocalDates(workouts), [workouts])
  const days = useMemo(
    () => buildMonthGrid(year, month, trained, program ?? null, routine?.daysCount ?? 0),
    [year, month, trained, program, routine]
  )

  const startPad = new Date(year, month, 1).getDay()
  const today = toLocalDateStr()

  const prev = () => {
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else setMonth((m) => m - 1)
  }
  const next = () => {
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else setMonth((m) => m + 1)
  }

  const title = new Date(year, month, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  return (
    <div>
      <AppHeader title="Calendario" subtitle={routine ? `Programa: ${routine.title}` : 'Sin programa activo'} />
      <div className="space-y-4 p-4">
        <Link to="/" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft">
          <ArrowLeft className="size-4" /> Inicio
        </Link>

        <div className="flex items-center justify-between rounded-2xl border border-gold/40 bg-bg-elevated px-2 py-2">
          <button type="button" onClick={prev} className="flex size-11 items-center justify-center rounded-xl text-accent" aria-label="Mes anterior">
            <ChevronLeft className="size-5" />
          </button>
          <span className="font-display text-base capitalize text-fg">{title}</span>
          <button type="button" onClick={next} className="flex size-11 items-center justify-center rounded-xl text-accent" aria-label="Mes siguiente">
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[0.65rem] uppercase text-muted">
          {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startPad }).map((_, i) => (
            <span key={`p-${i}`} />
          ))}
          {days.map((d) => {
            const dayNum = Number(d.date.slice(8, 10))
            const isToday = d.date === today
            return (
              <div
                key={d.date}
                className={`flex min-h-[44px] flex-col items-center justify-center rounded-xl border text-sm ${statusClass[d.status]} ${isToday ? 'ring-1 ring-accent' : ''}`}
                title={d.status}
              >
                <span className="font-medium">{dayNum}</span>
                {d.routineDayIndex !== null ? (
                  <span className="text-[0.55rem] opacity-80">D{d.routineDayIndex + 1}</span>
                ) : null}
              </div>
            )
          })}
        </div>

        <ul className="space-y-1 text-xs text-muted">
          <li>● Hecho · ○ Programado · ◐ Ambos · − Descanso</li>
          <li>
            Activa un programa desde el detalle de una rutina (“Seguir rutina”) para ver días programados.
          </li>
        </ul>
      </div>
    </div>
  )
}
