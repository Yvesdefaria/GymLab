// Página /rutinas/:slug: detalle editorial de una rutina.
// Composición: portada (RoutineHero), fila de stats C1, tabs por día con filas hairline,
// «seguir programa» al final y barra fija con el entreno del día.
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Pencil, Play, Trash2 } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { SHELL_MAX_W } from '@/components/layout/shellWidth'
import { routineRepo } from '@/data/repositories'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useStartSession } from '@/hooks/useStartSession'
import { useRoutineDetail, useRoutineSlugs, useRoutines } from '@/hooks/useRoutines'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { useRoutineFavorites } from '@/hooks/useRoutineFavorites'
import { cloneRoutineDraft, uniqueSlug } from '@/domain/routines'
import { track } from '@/lib/telemetry'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import { TabNav } from '@/components/ui/TabNav'
import { StatsStatRow } from '@/components/stats/StatsStatRow'
import { RoutineHero } from '@/components/routines/RoutineHero'
import { RoutineDayPanel } from '@/components/routines/RoutineDayPanel'
import { RoutineFollowCard } from '@/components/routines/RoutineFollowCard'
import { RepeatLastButton } from '@/components/routines/RepeatLastButton'
import { estimateWorkoutMinutes } from '@/domain/calendar'
import { localizeRoutine, localizeRoutineDay } from '@/i18n/catalog'
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
  // Pool de portadas del catálogo: las rutinas propias toman una prestada por id.
  const { routines } = useRoutines()
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
  const catalogImages = useMemo(() => routines.flatMap((r) => (r.imageUrl ? [r.imageUrl] : [])), [routines])

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
  // Los tabs muestran el nombre corto del día ("Push" de "Push (Pecho/Hombro/Tríceps)"):
  // el nombre completo se repite como título de la sección y no entra en la barra.
  const shortDayLabel = (name: string) => name.split('(')[0].trim() || name
  const dayTabs = days.map((d) => ({ id: String(d.dayIndex), label: shortDayLabel(localizeRoutineDay(d, lang).name) }))
  const activeTab = activeDay ? String(activeDay.dayIndex) : ''

  // Panel del día: se comparte entre el modo con tabs (varios días) y el de un solo día.
  const dayPanel = activeDay ? (
    <RoutineDayPanel
      day={localizeRoutineDay(activeDay, lang)}
      items={dayItems}
      isCustom={routine.isCustom ?? false}
      editPath={`/rutinas/${routine.slug}/editar`}
      etaMin={etaMin}
    />
  ) : null

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
      // Items de los días en paralelo; Promise.all conserva el orden de días y de items por día.
      const rItems = (await Promise.all(rDays.map((day) => routineRepo.getItems(day.id)))).flat()
      const draft = cloneRoutineDraft(routine, rDays, rItems)
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
        kicker={t('rutinas.tituloSingular')}
        actions={
          <button
            type="button"
            onClick={() => void (routine.isCustom ? navigate(`/rutinas/${routine.slug}/editar`) : handleClone())}
            disabled={cloning}
            aria-label={routine.isCustom ? t('rutinas.detalle.editar') : t('rutinas.detalle.editarPredefinida')}
            className="flex size-11 items-center justify-center rounded-full border border-border/60 text-muted transition-colors hover:border-cta hover:text-accent-soft disabled:opacity-50"
          >
            <Pencil className="size-4" aria-hidden />
          </button>
        }
      />
      <div className="space-y-5 px-4 pb-48 pt-3">
        <BackLink to="/rutinas" label={t('rutinas.backLinkTodas')} />

        <div>
          <RoutineHero
            routine={routine}
            fallbackImages={catalogImages}
            isFavorite={isFavorite(routine.id)}
            onToggleFavorite={() => {
              const next = !isFavorite(routine.id)
              void toggleFavorite(routine.id)
              track('routine_favorited', { value: next })
            }}
          />
          <StatsStatRow
            items={[
              { value: String(allItems.length), label: t('rutinas.detalle.statEjercicios') },
              { value: String(routine.daysCount), label: t('rutinas.detalle.statDias') },
              { value: String(etaMin), label: t('rutinas.detalle.statMinDia') },
            ]}
          />
        </div>

        {dayTabs.length > 1 ? (
          <TabNav
            variant="compact"
            ariaLabel={t('rutinas.detalle.diasAria')}
            tabs={dayTabs}
            active={activeTab}
            onChange={(id) => setSelectedDay(Number(id))}
          >
            {dayPanel}
          </TabNav>
        ) : (
          dayPanel
        )}

        <RoutineFollowCard routine={routine} isActiveRoutine={isActiveRoutine} initialWeekdays={initialWeekdays} />

        {routine.isCustom ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 border-t border-border/40 pt-1 text-xs text-danger"
          >
            <Trash2 className="size-4" aria-hidden /> {t('rutinas.detalle.eliminarTitulo')}
          </button>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 bg-gradient-to-t from-bg via-bg/95 to-transparent px-4 pb-3 pt-6">
        <div className={`mx-auto ${SHELL_MAX_W} flex flex-col gap-1`}>
          <Button
            size="lg"
            className="w-full"
            onClick={handlePlay}
            disabled={hasActiveWorkout || dayItems.length === 0}
          >
            <Play className="size-5" fill="currentColor" aria-hidden />
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
