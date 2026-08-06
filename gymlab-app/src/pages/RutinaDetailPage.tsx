import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Play,
  Calendar,
  Clock,
  BookmarkPlus,
  Check,
  Pencil,
  Trash2,
} from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { routineRepo, activeProgramRepo } from '@/data/repositories'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useStartSession } from '@/hooks/useStartSession'
import { useRoutineDetail } from '@/hooks/useRoutines'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { BackLink } from '@/components/ui/BackLink'
import { estimateWorkoutMinutes } from '@/domain/calendar'
import { toLocalDateStr } from '@/domain/dates'
import { OBJECTIVE_ICONS } from '@/components/routines/routineMeta'
import { OBJECTIVE_LABELS, LEVEL_LABELS } from '@/domain/routines'

const WEEKDAY_OPTS = [
  { v: 1, l: 'L' },
  { v: 2, l: 'M' },
  { v: 3, l: 'X' },
  { v: 4, l: 'J' },
  { v: 5, l: 'V' },
  { v: 6, l: 'S' },
  { v: 0, l: 'D' },
]

export const RutinaDetailPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [selectedDay, setSelectedDay] = useState<number | null>(0)
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5])
  const [following, setFollowing] = useState(false)
  const { startedAt } = useActiveWorkoutStore()
  const { startRoutineDay } = useStartSession()

  const { routine, days, items: allItems } = useRoutineDetail(slug)
  const { program } = useActiveProgram()
  const isActiveRoutine = Boolean(routine && program && program.routineId === routine.id)

  const activeDay =
    selectedDay !== null ? days.find((d) => d.dayIndex === selectedDay) : days[0]
  const dayItems = useMemo(
    () => (activeDay ? allItems.filter((i) => i.routineDayId === activeDay.id) : []),
    [activeDay, allItems]
  )
  const etaMin = useMemo(() => estimateWorkoutMinutes(dayItems), [dayItems])

  if (!routine) {
    return (
      <div>
        <AppHeader title="Rutina" />
        <div className="p-4">
          <BackLink to="/rutinas" />
          <div className="mt-4 panel rounded-2xl p-5 text-center">
            <p className="text-sm text-muted">Rutina no encontrada.</p>
          </div>
        </div>
      </div>
    )
  }

  const Icon = OBJECTIVE_ICONS[routine.objective]
  const displayDays = selectedDay !== null ? days.filter((d) => d.dayIndex === selectedDay) : days
  const hasActiveWorkout = startedAt !== null

  const toggleWd = (v: number) => {
    setWeekdays((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v].sort((a, b) => a - b)
    )
  }

  const handleFollow = async () => {
    if (weekdays.length === 0) return
    setFollowing(true)
    await activeProgramRepo.set({
      routineId: routine.id,
      startDate: toLocalDateStr(),
      weekdays,
      createdAt: new Date().toISOString(),
    })
    setFollowing(false)
  }

  const handlePlay = async () => {
    if (!activeDay || dayItems.length === 0) return
    await startRoutineDay(
      dayItems.map((it) => ({
        exerciseId: it.exerciseId,
        exerciseName: it.exerciseName ?? `Ejercicio ${it.exerciseId}`,
        restSec: it.restSec,
        supersetGroup: it.supersetGroup,
        targetSets: it.targetSets,
        targetReps: it.targetReps,
      })),
      routine.id,
      activeDay.id
    )
    navigate('/entrenamiento/active')
  }

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta rutina propia? Esta acción no se puede deshacer.')) return
    await routineRepo.deleteRoutine(routine.id)
    navigate('/rutinas')
  }

  return (
    <div>
      <AppHeader
        title={routine.title}
        subtitle={`${LEVEL_LABELS[routine.level]} · ${routine.daysCount} días · ${OBJECTIVE_LABELS[routine.objective]}`}
      />
      <div className="space-y-4 p-4 pb-28">
        <BackLink to="/rutinas" label="Todas las rutinas" />

        <div className="panel rounded-2xl p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1 text-xs font-medium uppercase tracking-wide text-accent-soft">
              <Icon className="size-4" />
              {OBJECTIVE_LABELS[routine.objective]}
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              {routine.daysCount === 1 ? 'Sesión suelta' : `${routine.daysCount} días/semana`}
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-xs capitalize text-muted">
              {LEVEL_LABELS[routine.level]}
            </span>
          </div>
          <p className="text-sm text-fg">{routine.description}</p>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Clock className="size-4 text-accent" />
            Duración estimada del día: <strong className="text-fg">~{etaMin} min</strong>
          </p>
        </div>

        <div className="panel rounded-2xl p-4">
          <p className="mb-2 kicker">Seguir programa · días</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_OPTS.map((w) => (
              <button
                key={w.v}
                type="button"
                onClick={() => toggleWd(w.v)}
                className={`flex size-11 items-center justify-center rounded-xl border text-sm font-medium ${
                  weekdays.includes(w.v)
                    ? 'border-cta bg-cta/20 text-accent-soft'
                    : 'border-border text-muted'
                }`}
              >
                {w.l}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleFollow}
            disabled={following || weekdays.length === 0}
            className={`mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl text-sm disabled:opacity-50 ${
              isActiveRoutine
                ? 'border border-cta bg-cta/20 text-accent-soft'
                : 'border border-gold/50 text-accent-soft'
            }`}
          >
            {isActiveRoutine ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <BookmarkPlus className="size-4" aria-hidden />
            )}
            {following
              ? 'Guardando…'
              : isActiveRoutine
                ? 'Rutina activa · actualizar días'
                : 'Seguir esta rutina'}
          </button>
        </div>

        {routine.isCustom ? (
          <div className="flex gap-3">
            <Link
              to={`/rutinas/${routine.slug}/editar`}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-gold/50 text-sm text-accent-soft"
            >
              <Pencil className="size-4" /> Editar
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-danger/40 text-sm text-danger"
            >
              <Trash2 className="size-4" /> Eliminar
            </button>
          </div>
        ) : null}

        <div className="flex gap-2 overflow-x-auto">
          {days.map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.dayIndex)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedDay === day.dayIndex
                  ? 'border border-cta bg-cta/20 text-accent-soft'
                  : 'border border-border text-muted hover:border-cta hover:text-accent-soft'
              }`}
            >
              {day.name}
            </button>
          ))}
        </div>

        {displayDays.map((day) => {
          const items = allItems.filter((i) => i.routineDayId === day.id)
          return (
            <div key={day.id} className="panel rounded-2xl p-4">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="size-4 text-accent" />
                <h3 className="font-display text-sm font-semibold text-accent">{day.name}</h3>
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="min-w-0 text-sm text-fg">
                      {item.exerciseSlug ? (
                        <Link
                          to={`/ejercicios/${item.exerciseSlug}`}
                          className="inline-block max-w-full truncate text-fg underline-offset-4 transition-colors hover:text-accent-soft hover:underline"
                        >
                          {item.exerciseName ?? `Ejercicio #${item.exerciseId}`}
                        </Link>
                      ) : (
                        item.exerciseName ?? `Ejercicio #${item.exerciseId}`
                      )}
                    </span>
                    <span className="text-xs text-muted">
                      {item.targetSets}×{item.targetReps} · {item.restSec}s
                    </span>
                  </div>
                ))}
              </div>
              {items.length === 0 && (
                <p className="rounded-xl border border-dashed border-border/60 bg-bg/40 px-3 py-4 text-center text-xs text-muted">
                  Este día aún no tiene ejercicios.
                  {routine.isCustom && (
                    <>
                      {' '}
                      <Link
                        to={`/rutinas/${routine.slug}/editar`}
                        className="text-accent-soft underline underline-offset-2"
                      >
                        Añádelos en el editor
                      </Link>
                      .
                    </>
                  )}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4 pb-3">
        <div className="mx-auto max-w-lg">
          <button
            onClick={handlePlay}
            disabled={hasActiveWorkout || dayItems.length === 0}
            className="gold-gradient flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-display text-lg font-semibold tracking-wide text-on-gold shadow-lg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Play className="size-5" fill="currentColor" />
            {hasActiveWorkout
              ? 'Entreno en curso'
              : `Play · ~${etaMin} min`}
          </button>
        </div>
      </div>
    </div>
  )
}
