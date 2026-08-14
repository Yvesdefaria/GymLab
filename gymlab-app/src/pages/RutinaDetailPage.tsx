// Página /rutinas/:slug: detalle de una rutina (días, ejercicios, duración estimada).
// Permite seguirla como programa activo, lanzar el entreno del día, favoritas y editar/borrar las propias.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Play,
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
import { TabNav } from '@/components/ui/TabNav'
import { RoutineDayPanel } from '@/components/routines/RoutineDayPanel'
import { estimateWorkoutMinutes } from '@/domain/calendar'
import { toLocalDateStr } from '@/domain/dates'
import { OBJECTIVE_ICONS } from '@/components/routines/routineMeta'
import { localizeRoutine, localizeRoutineDay, localizeObjective, localizeLevel } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'

// Días de la semana con su inicial (v: valor JS Date.getDay(), k: clave i18n de la etiqueta corta).
const WEEKDAY_OPTS = [
  { v: 1, k: 'rutinas.detalle.dia.lunes' },
  { v: 2, k: 'rutinas.detalle.dia.martes' },
  { v: 3, k: 'rutinas.detalle.dia.miercoles' },
  { v: 4, k: 'rutinas.detalle.dia.jueves' },
  { v: 5, k: 'rutinas.detalle.dia.viernes' },
  { v: 6, k: 'rutinas.detalle.dia.sabado' },
  { v: 0, k: 'rutinas.detalle.dia.domingo' },
] as const

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
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
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
        <AppHeader title={t('rutinas.tituloSingular')} />
        <div className="p-4">
          <BackLink to="/rutinas" />
          <div className="mt-4 panel rounded-2xl p-5 text-center">
            <p className="text-sm text-muted">{t('rutinas.detalle.noEncontrada')}</p>
          </div>
        </div>
      </div>
    )
  }

  const Icon = OBJECTIVE_ICONS[routine.objective]
  const hasActiveWorkout = startedAt !== null
  const localizedRoutine = localizeRoutine(routine, lang)
  const dayTabs = days.map((d) => ({ id: String(d.dayIndex), label: localizeRoutineDay(d, lang).name }))
  const activeTab = activeDay ? String(activeDay.dayIndex) : ''

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
        title={localizedRoutine.title}
        subtitle={t('rutinas.detalle.subtitulo', {
          level: localizeLevel(routine.level, lang),
          days: routine.daysCount,
          objective: localizeObjective(routine.objective, lang),
        })}
      />
      <div className="space-y-4 p-4 pb-28">
        <BackLink to="/rutinas" label={t('rutinas.backLinkTodas')} />

        <div className="panel-elevated rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <div className="mb-2 flex flex-1 flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1 text-xs font-medium uppercase tracking-wide text-accent-soft">
                <Icon className="size-4" />
                {localizeObjective(routine.objective, lang)}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                {routine.daysCount === 1 ? t('rutinas.sesionSuelta') : t('rutinas.diasSemana', { count: routine.daysCount })}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-xs capitalize text-muted">
                {localizeLevel(routine.level, lang)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void toggleFavorite(routine.id)}
              aria-pressed={isFavorite(routine.id)}
              aria-label={
                isFavorite(routine.id)
                  ? t('rutinas.quitarFavoritas')
                  : t('rutinas.anadirFavoritas')
              }
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                isFavorite(routine.id)
                  ? 'border-cta bg-cta/20 text-cta'
                  : 'border-border text-muted hover:border-cta hover:text-accent-soft'
              }`}
            >
              <Star className="size-5" fill={isFavorite(routine.id) ? 'currentColor' : 'none'} />
            </button>
          </div>
          <p className="text-sm text-fg">{localizedRoutine.description}</p>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Clock className="size-4 text-accent" />
            {t('rutinas.detalle.duracionEstimada')} <strong className="text-fg">~{etaMin} min</strong>
          </p>
        </div>

        <div className="panel rounded-2xl p-4">
          <p className="mb-2 kicker">{t('rutinas.detalle.seguirProgramaDias')}</p>
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
                {t(w.k)}
              </button>
            ))}
          </div>
          {weekdays.length < routine.daysCount && (
            <p role="status" className="mt-2 text-xs text-muted">
              {t('rutinas.detalle.seleccionaDias', { count: routine.daysCount })}
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
              ? t('rutinas.guardando')
              : isActiveRoutine
                ? t('rutinas.detalle.activaActualizarDias')
                : t('rutinas.detalle.seguirRutina')}
          </button>
        </div>

        {routine.isCustom ? (
          <div className="flex gap-3">
            <Link
              to={`/rutinas/${routine.slug}/editar`}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-gold/50 text-sm text-accent-soft"
            >
              <Pencil className="size-4" /> {t('rutinas.detalle.editar')}
            </Link>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-danger/40 text-sm text-danger"
            >
              <Trash2 className="size-4" /> {t('rutinas.detalle.eliminar')}
            </button>
          </div>
        ) : null}

        {dayTabs.length > 0 && (
          <TabNav
            ariaLabel={t('rutinas.detalle.diasAria')}
            tabs={dayTabs}
            active={activeTab}
            onChange={(id) => setSelectedDay(Number(id))}
          >
            {activeDay && (
              <RoutineDayPanel
                day={activeDay}
                items={dayItems}
                isCustom={routine.isCustom ?? false}
                editPath={`/rutinas/${routine.slug}/editar`}
              />
            )}
          </TabNav>
        )}
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
              ? t('rutinas.detalle.entrenoEnCurso')
              : t('rutinas.detalle.play', { min: etaMin })}
          </Button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmSheet
          title={t('rutinas.detalle.eliminarTitulo')}
          message={t('rutinas.detalle.eliminarMensaje')}
          confirmLabel={t('rutinas.detalle.eliminar')}
          cancelLabel={t('rutinas.detalle.cancelar')}
          destructive
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
