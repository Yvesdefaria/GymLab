import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Play,
  Calendar,
  Dumbbell,
  Flame,
  Zap,
  Target,
  Trophy,
  Clock,
  BookmarkPlus,
  Pencil,
  Trash2,
} from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { useLiveQuery } from 'dexie-react-hooks'
import { routineRepo, exerciseRepo, activeProgramRepo } from '@/data/repositories'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useSessionPreload } from '@/hooks/useSessionPreload'
import { estimateWorkoutMinutes } from '@/domain/calendar'
import { toLocalDateStr } from '@/domain/dates'
import type { Objective, Level, RoutineItem } from '@/domain/types'

const objectiveLabels: Record<Objective, string> = {
  volumen: 'Volumen',
  definicion: 'Definición',
  fuerza: 'Fuerza',
  resistencia: 'Resistencia',
  general: 'General',
}

const levelLabels: Record<Level, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
}

const objectiveIcons: Record<Objective, typeof Flame> = {
  volumen: Dumbbell,
  definicion: Flame,
  fuerza: Zap,
  resistencia: Target,
  general: Trophy,
}

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
  const { loadRoutineDay, startedAt } = useActiveWorkoutStore()
  const { loadLastSets, buildSets } = useSessionPreload()

  const routine = useLiveQuery(
    () => (slug ? routineRepo.getBySlug(slug) : undefined),
    [slug]
  )

  const days = useLiveQuery(
    () => (routine ? routineRepo.getDays(routine.id) : []),
    [routine]
  ) ?? []

  const allItems =
    useLiveQuery(async () => {
      if (days.length === 0) return []
      const items: (RoutineItem & { exerciseName?: string })[] = []
      for (const day of days) {
        const dayItems = await routineRepo.getItems(day.id)
        for (const item of dayItems) {
          const ex = await exerciseRepo.getById(item.exerciseId)
          items.push({ ...item, exerciseName: ex?.name })
        }
      }
      return items
    }, [days]) ?? []

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
          <Link to="/rutinas" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft">
            <ArrowLeft className="size-4" /> Volver
          </Link>
          <div className="mt-4 rounded-2xl border border-gold/40 bg-bg-elevated p-5 text-center">
            <p className="text-sm text-muted">Rutina no encontrada.</p>
          </div>
        </div>
      </div>
    )
  }

  const Icon = objectiveIcons[routine.objective]
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
    const lastMap = await loadLastSets(dayItems.map((it) => it.exerciseId))
    loadRoutineDay(
      dayItems.map((it) => {
        const name = it.exerciseName ?? `Ejercicio ${it.exerciseId}`
        return {
          exerciseId: it.exerciseId,
          exerciseName: name,
          restSec: it.restSec,
          sets: buildSets(it.exerciseId, name, {
            targetSets: it.targetSets,
            targetReps: it.targetReps,
            last: lastMap.get(it.exerciseId),
          }),
        }
      }),
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
        subtitle={`${levelLabels[routine.level]} · ${routine.daysCount} días · ${objectiveLabels[routine.objective]}`}
      />
      <div className="space-y-4 p-4 pb-28">
        <Link to="/rutinas" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft">
          <ArrowLeft className="size-4" />
          Todas las rutinas
        </Link>

        <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
          <div className="mb-2 flex items-center gap-2">
            <Icon className="size-5 text-accent" />
            <span className="font-display text-sm font-semibold text-accent">
              {objectiveLabels[routine.objective]}
            </span>
          </div>
          <p className="text-sm text-fg">{routine.description}</p>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Clock className="size-4 text-accent" />
            Duración estimada del día: <strong className="text-fg">~{etaMin} min</strong>
          </p>
        </div>

        <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
          <p className="mb-2 text-xs uppercase tracking-wider text-muted">Seguir programa · días</p>
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
            className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-gold/50 text-sm text-accent-soft disabled:opacity-50"
          >
            <BookmarkPlus className="size-4" />
            {following ? 'Guardando…' : 'Seguir esta rutina'}
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
            <div key={day.id} className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
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
                    <span className="text-sm text-fg">
                      {item.exerciseName ?? `Ejercicio #${item.exerciseId}`}
                    </span>
                    <span className="text-xs text-muted">
                      {item.targetSets}×{item.targetReps} · {item.restSec}s
                    </span>
                  </div>
                ))}
              </div>
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
