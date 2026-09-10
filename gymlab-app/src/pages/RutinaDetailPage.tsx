// Página /rutinas/:slug: detalle de una rutina (días, ejercicios, duración estimada).
// Composición fina: metadatos en RoutineInfoCard, "seguir programa" en RoutineFollowCard y
// "repetir última sesión" en RepeatLastButton; solo quedan play/editar/eliminar y las pestañas.
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Pencil, Play, Trash2 } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { routineRepo } from '@/data/repositories'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useStartSession } from '@/hooks/useStartSession'
import { useRoutineDetail, useRoutineSlugs } from '@/hooks/useRoutines'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { useRoutineFavorites } from '@/hooks/useRoutineFavorites'
import { cloneRoutineDraft, uniqueSlug } from '@/domain/routines'
import type { RoutineItem } from '@/domain/types'
import { track } from '@/lib/telemetry'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import { TabNav } from '@/components/ui/TabNav'
import { RoutineDayPanel } from '@/components/routines/RoutineDayPanel'
import { RoutineInfoCard } from '@/components/routines/RoutineInfoCard'
import { RoutineFollowCard } from '@/components/routines/RoutineFollowCard'
import { RepeatLastButton } from '@/components/routines/RepeatLastButton'
import { estimateWorkoutMinutes } from '@/domain/calendar'
import { localizeLevel, localizeObjective, localizeRoutine, localizeRoutineDay } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'

export const RutinaDetailPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { slug } = useParams()
  const navigate = useNavigate()
  const [selectedDay, setSelectedDay] = useState<number | null>(0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [cloning, setCloning] = useState(false)
  const startedAt = useActiveWorkoutStore((s) => s.startedAt)
  const { startRoutineDay } = useStartSession()

  const { routine, days, items: allItems } = useRoutineDetail(slug)
  const { slugs: allSlugs } = useRoutineSlugs()
  const { program } = useActiveProgram()
  const { isFavorite, toggle: toggleFavorite } = useRoutineFavorites()
  const isActiveRoutine = Boolean(routine && program && program.routineId === routine.id)
  const initialWeekdays = program && routine && program.routineId === routine.id ? program.weekdays : []

  const activeDay = selectedDay !== null ? days.find((d) => d.dayIndex === selectedDay) : days[0]

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

  const hasActiveWorkout = startedAt !== null
  const localizedRoutine = localizeRoutine(routine, lang)
  const dayTabs = days.map((d) => ({ id: String(d.dayIndex), label: localizeRoutineDay(d, lang).name }))
  const activeTab = activeDay ? String(activeDay.dayIndex) : ''

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

  // Clona una rutina predefinida como custom (with basedOnId) y abre el editor del clon.
  const handleClone = async () => {
    if (cloning) return
    setCloning(true)
    try {
      const rDays = await routineRepo.getDays(routine.id)
      const dayItems: RoutineItem[] = []
      for (const day of rDays) {
        dayItems.push(...(await routineRepo.getItems(day.id)))
      }
      const draft = cloneRoutineDraft(routine, rDays, dayItems)
      draft.slug = uniqueSlug(routine.title, allSlugs)
      await routineRepo.createRoutine(draft)
      navigate(`/rutinas/${draft.slug}/editar`)
    } finally {
      setCloning(false)
    }
  }

  return (
    <div>
      <AppHeader
        title={localizedRoutine.title}
        subtitle={t('rutinas.detalle.subtitulo', {
          nivel: localizeLevel(routine.level, lang),
          dias: routine.daysCount,
          objetivo: localizeObjective(routine.objective, lang),
        })}
      />
      <div className="space-y-4 p-4 pb-28">
        <BackLink to="/rutinas" label={t('rutinas.backLinkTodas')} />

        <RoutineInfoCard
          routine={routine}
          etaMin={etaMin}
          isFavorite={isFavorite(routine.id)}
          onToggleFavorite={() => {
            const next = !isFavorite(routine.id)
            void toggleFavorite(routine.id)
            track('routine_favorited', { value: next })
          }}
        />

        <RoutineFollowCard routine={routine} isActiveRoutine={isActiveRoutine} initialWeekdays={initialWeekdays} />

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
        ) : (
          <button
            type="button"
            onClick={() => void handleClone()}
            disabled={cloning}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-gold/50 text-sm text-accent-soft"
          >
            <Pencil className="size-4" /> {cloning ? t('rutinas.guardando') : t('rutinas.detalle.editarPredefinida')}
          </button>
        )}

        {dayTabs.length > 0 && (
          <TabNav
            ariaLabel={t('rutinas.detalle.diasAria')}
            tabs={dayTabs}
            active={activeTab}
            onChange={(id) => setSelectedDay(Number(id))}
          >
            {activeDay && (
              <RoutineDayPanel
                day={localizeRoutineDay(activeDay, lang)}
                items={dayItems}
                isCustom={routine.isCustom ?? false}
                editPath={`/rutinas/${routine.slug}/editar`}
              />
            )}
          </TabNav>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4 pb-3">
        <div className="mx-auto max-w-lg flex flex-col gap-2">
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
          <RepeatLastButton routineId={routine.id} dayId={activeDay?.id ?? null} disabled={hasActiveWorkout} />
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