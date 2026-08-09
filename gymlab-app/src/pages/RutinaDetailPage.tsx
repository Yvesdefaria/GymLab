// Página /rutinas/:slug: detalle de una rutina (días, ejercicios, duración estimada).
// Permite seguirla como programa activo, lanzar el entreno del día, favoritas y editar/borrar las propias.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Play,
  Calendar,
  Clock,
  BookmarkPlus,
  Check,
  Pencil,
  Trash2,
  Star,
} from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { routineRepo, activeProgramRepo } from '@/data/repositories'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useStartSession } from '@/hooks/useStartSession'
import { useRoutineDetail } from '@/hooks/useRoutines'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { useRoutineFavorites } from '@/hooks/useRoutineFavorites'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import { estimateWorkoutMinutes } from '@/domain/calendar'
import { toLocalDateStr } from '@/domain/dates'
import { OBJECTIVE_ICONS } from '@/components/routines/routineMeta'
import { OBJECTIVE_LABELS, LEVEL_LABELS } from '@/domain/routines'

// Días de la semana con su inicial (v: valor JS Date.getDay(), l: etiqueta corta).
const WEEKDAY_OPTS = [
  { v: 1, l: 'L' },
  { v: 2, l: 'M' },
  { v: 3, l: 'X' },
  { v: 4, l: 'J' },
  { v: 5, l: 'V' },
  { v: 6, l: 'S' },
  { v: 0, l: 'D' },
]

// Días por defecto sugeridos según cuántos entrenos a la semana tenga la rutina.
const DEFAULT_WEEKDAYS: Record<number, number[]> = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [1, 2, 3, 4, 5, 6, 0],
}

export const RutinaDetailPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [selectedDay, setSelectedDay] = useState<number | null>(0)
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5])
  const [following, setFollowing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const startedAt = useActiveWorkoutStore((s) => s.startedAt)
  const { startRoutineDay } = useStartSession()

  const { routine, days, items: allItems } = useRoutineDetail(slug)
  const { program } = useActiveProgram()
  const { isFavorite, toggle: toggleFavorite } = useRoutineFavorites()
  const isActiveRoutine = Boolean(routine && program && program.routineId === routine.id)

  // Precarga los días de la semana: los del programa activo si coincide, si no los sugeridos.
  const prefilled = useRef(false)
  useEffect(() => {
    if (!routine || prefilled.current) return
    prefilled.current = true
    if (program && program.routineId === routine.id && program.weekdays.length > 0) {
      setWeekdays([...program.weekdays])
    } else {
      setWeekdays(DEFAULT_WEEKDAYS[routine.daysCount] ?? [1])
    }
  }, [routine, program])

  const activeDay =
    selectedDay !== null ? days.find((d) => d.dayIndex === selectedDay) : days[0]
  // Ejercicios del día seleccionado y duración estimada para el botón Play.
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

  // Marca/desmarca un día de la semana manteniendo el orden ascendente.
  const toggleWd = (v: number) => {
    setWeekdays((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v].sort((a, b) => a - b)
    )
  }

  // Activa/actualiza el programa: requiere elegir tantos días como sesiones semanales.
  const handleFollow = async () => {
    if (weekdays.length < routine.daysCount) return
    setFollowing(true)
    await activeProgramRepo.set({
      routineId: routine.id,
      startDate: toLocalDateStr(),
      weekdays,
      createdAt: new Date().toISOString(),
    })
    setFollowing(false)
  }

  // Lanza el entreno del día: crea una sesión activa desde los ejercicios de la rutina.
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

  // Borra una rutina propia; la confirmación previa la gestiona el sheet.
  const handleDelete = async () => {
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
          <div className="flex items-start gap-2">
            <div className="mb-2 flex flex-1 flex-wrap items-center gap-2">
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
            <button
              type="button"
              onClick={() => void toggleFavorite(routine.id)}
              aria-pressed={isFavorite(routine.id)}
              aria-label={`${isFavorite(routine.id) ? 'Quitar de favoritas' : 'Añadir a favoritas'}`}
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                isFavorite(routine.id)
                  ? 'border-cta bg-cta/20 text-cta'
                  : 'border-border text-muted hover:border-cta hover:text-accent-soft'
              }`}
            >
              <Star className="size-5" fill={isFavorite(routine.id) ? 'currentColor' : 'none'} />
            </button>
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
                aria-pressed={weekdays.includes(w.v)}
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
          {weekdays.length < routine.daysCount && (
            <p role="status" className="mt-2 text-xs text-muted">
              Selecciona al menos {routine.daysCount}{' '}
              {routine.daysCount === 1 ? 'día' : 'días'} para seguir este programa.
            </p>
          )}
          <button
            type="button"
            onClick={handleFollow}
            disabled={following || weekdays.length < routine.daysCount}
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
              onClick={() => setConfirmDelete(true)}
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
              className={`inline-flex min-h-[44px] shrink-0 items-center rounded-full px-3 text-xs font-medium transition-colors ${
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
          <Button
            size="lg"
            className="w-full"
            onClick={handlePlay}
            disabled={hasActiveWorkout || dayItems.length === 0}
          >
            <Play className="size-5" fill="currentColor" />
            {hasActiveWorkout
              ? 'Entreno en curso'
              : `Play · ~${etaMin} min`}
          </Button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmSheet
          title="Eliminar rutina"
          message="¿Eliminar esta rutina propia? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          destructive
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
