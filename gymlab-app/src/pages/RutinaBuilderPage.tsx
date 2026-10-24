// Página /rutinas/nueva y /rutinas/:slug/editar: editor de rutinas propias (borrador en memoria).
// Composición fina: estado/borrador en useRoutineDraft, reorden por arrastre en useDragReorder
// y presentación en componentes (formulario hairline + días con filas compactas).
import { memo, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { SHELL_MAX_W } from '@/components/layout/shellWidth'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { RoutineDayEditor } from '@/components/routines/RoutineDayEditor'
import { RoutineInfoForm } from '@/components/routines/RoutineInfoForm'
import { useDragReorder } from '@/hooks/useDragReorder'
import { useRoutineDraft } from '@/hooks/useRoutineDraft'
import type { RoutineDraftDay } from '@/domain/routines'

interface DayWrapperProps {
  day: RoutineDraftDay
  dayIndex: number
  totalDays: number
  onRenameDay: (dayIndex: number, name: string) => void
  onRemoveDay: (dayIndex: number) => void
  onPickExercise: (dayIndex: number) => void
  onUpdateItem: (dayIndex: number, itemIndex: number, patch: any) => void
  onRemoveItem: (dayIndex: number, itemIndex: number) => void
  onDayDragStart: (col: number, idx: number, e: React.PointerEvent) => void
  onDayDragMove: (col: number, e: React.PointerEvent) => void
  onDayDragEnd: () => void
  isDayDragging: (col: number, idx: number) => boolean
  isDayOver: (col: number, idx: number) => boolean
  registerDayRef: (key: string, el: HTMLDivElement | null) => void
  isDragging: (dayIndex: number, itemIndex: number) => boolean
  isOver: (dayIndex: number, itemIndex: number) => boolean
  onDragStart: (dayIndex: number, itemIndex: number, e: React.PointerEvent) => void
  onDragMove: (dayIndex: number, e: React.PointerEvent) => void
  onDragEnd: () => void
  registerItemRef: (key: string, el: HTMLDivElement | null) => void
}

const DayWrapper = memo(({
  day,
  dayIndex,
  totalDays,
  onRenameDay,
  onRemoveDay,
  onPickExercise,
  onUpdateItem,
  onRemoveItem,
  onDayDragStart,
  onDayDragMove,
  onDayDragEnd,
  isDayDragging,
  isDayOver,
  registerDayRef,
  isDragging,
  isOver,
  onDragStart,
  onDragMove,
  onDragEnd,
  registerItemRef,
}: DayWrapperProps) => {
  const handleRename = useCallback((name: string) => onRenameDay(dayIndex, name), [dayIndex, onRenameDay])
  const handleRemove = useCallback(() => onRemoveDay(dayIndex), [dayIndex, onRemoveDay])
  const handlePickExercise = useCallback(() => onPickExercise(dayIndex), [dayIndex, onPickExercise])
  const handleUpdateItem = useCallback(
    (itemIndex: number, patch: any) => onUpdateItem(dayIndex, itemIndex, patch),
    [dayIndex, onUpdateItem],
  )
  const handleRemoveItem = useCallback((itemIndex: number) => onRemoveItem(dayIndex, itemIndex), [dayIndex, onRemoveItem])
  const dayDragOnStart = useCallback(
    (e: React.PointerEvent) => onDayDragStart(0, dayIndex, e),
    [dayIndex, onDayDragStart],
  )
  const onPointerMove = useCallback((e: React.PointerEvent) => onDayDragMove(0, e), [onDayDragMove])

  const handleIsDragging = useCallback((itemIndex: number) => isDragging(dayIndex, itemIndex), [dayIndex, isDragging])
  const handleIsOver = useCallback((itemIndex: number) => isOver(dayIndex, itemIndex), [dayIndex, isOver])
  const handleDragStart = useCallback((itemIndex: number, e: React.PointerEvent) => onDragStart(dayIndex, itemIndex, e), [dayIndex, onDragStart])
  const handleDragMove = useCallback((e: React.PointerEvent) => onDragMove(dayIndex, e), [dayIndex, onDragMove])

  const drag = useMemo(
    () => ({
      isDragging: handleIsDragging,
      isOver: handleIsOver,
      onDragStart: handleDragStart,
      onDragMove: handleDragMove,
      onDragEnd,
      registerItemRef,
    }),
    [handleIsDragging, handleIsOver, handleDragStart, handleDragMove, onDragEnd, registerItemRef],
  )

  const dayDrag = useMemo(
    () => (totalDays > 1 ? { onDragStart: dayDragOnStart } : undefined),
    [totalDays, dayDragOnStart],
  )

  return (
    <div
      ref={(el) => registerDayRef(`0-${dayIndex}`, el)}
      onPointerMove={onPointerMove}
      onPointerUp={onDayDragEnd}
      className={`transition-colors ${
        isDayDragging(0, dayIndex) ? 'opacity-60' : isDayOver(0, dayIndex) ? 'bg-accent/5' : ''
      }`}
    >
      <RoutineDayEditor
        day={day}
        dayIndex={dayIndex}
        onRenameDay={handleRename}
        onRemoveDay={handleRemove}
        onPickExercise={handlePickExercise}
        onUpdateItem={handleUpdateItem}
        onRemoveItem={handleRemoveItem}
        dayDrag={dayDrag}
        drag={drag}
      />
    </div>
  )
})
DayWrapper.displayName = 'DayWrapper'

export const RutinaBuilderPage = () => {
  const { t } = useTranslation()
  const { slug } = useParams()
  const navigate = useNavigate()
  // Con slug la página actúa como editor; sin él, como creación.
  const editing = Boolean(slug)

  const {
    title,
    objective,
    level,
    description,
    days,
    saving,
    notFound,
    pickingDay,
    setTitle,
    setObjective,
    setLevel,
    setDescription,
    addDay,
    removeDay,
    updateDayName,
    addItemToDay,
    updateItem,
    removeItem,
    reorderItems,
    reorderDays,
    setPickingDay,
    save,
  } = useRoutineDraft(slug)

  const { registerItemRef, onDragStart, onDragMove, onDragEnd, isDragging, isOver } = useDragReorder({
    getItemCount: (dayIndex: number) => days[dayIndex]?.items.length ?? 0,
    onReorder: (dayIndex: number, fromIndex: number, toIndex: number) => reorderItems(dayIndex, fromIndex, toIndex),
  })

  // Segundo reordenador a nivel de días: los paneles se registran como una única
  // "columna" (dayIndex fijo 0) para reutilizar el mismo hook de arrastre.
  const {
    registerItemRef: registerDayRef,
    onDragStart: onDayDragStart,
    onDragMove: onDayDragMove,
    onDragEnd: onDayDragEnd,
    isDragging: isDayDragging,
    isOver: isDayOver,
  } = useDragReorder({
    getItemCount: () => days.length,
    onReorder: (_dayIndex: number, fromIndex: number, toIndex: number) => reorderDays(fromIndex, toIndex),
  })

  const handleSave = async () => {
    const finalSlug = await save()
    if (finalSlug) navigate(`/rutinas/${finalSlug}`)
  }

  if (notFound) {
    return (
      <div>
        <AppHeader title={t('rutinas.tituloSingular')} />
        <div className="p-4">
          <BackLink to="/rutinas" />
          <p className="mt-4 border-t border-border/40 pt-4 text-sm text-muted">{t('rutinas.builder.soloPropias')}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHeader
        title={editing ? t('rutinas.builder.tituloEditar') : t('rutinas.builder.tituloNueva')}
        subtitle={editing ? t('rutinas.builder.subtituloEditar') : t('rutinas.builder.subtitulo')}
      />
      <div className="space-y-5 px-4 pb-40 pt-3">
        <BackLink to="/rutinas" label={t('rutinas.titulo')} />

        <RoutineInfoForm
          title={title}
          objective={objective}
          level={level}
          description={description}
          onTitleChange={setTitle}
          onObjectiveChange={setObjective}
          onLevelChange={setLevel}
          onDescriptionChange={setDescription}
        />

        <div className="flex items-center justify-between gap-3">
          <h2 className="kicker">{t('rutinas.builder.dias', { count: days.length })}</h2>
          <button
            type="button"
            onClick={addDay}
            className="inline-flex min-h-[44px] items-center gap-1 text-xs font-medium text-accent-soft"
          >
            <Plus className="size-4" aria-hidden /> {t('rutinas.builder.anadirDia')}
          </button>
        </div>

        {days.map((day, dayIndex) => (
          <DayWrapper
            key={dayIndex}
            day={day}
            dayIndex={dayIndex}
            totalDays={days.length}
            onRenameDay={updateDayName}
            onRemoveDay={removeDay}
            onPickExercise={setPickingDay}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onDayDragStart={onDayDragStart}
            onDayDragMove={onDayDragMove}
            onDayDragEnd={onDayDragEnd}
            isDayDragging={isDayDragging}
            isDayOver={isDayOver}
            registerDayRef={registerDayRef}
            isDragging={isDragging}
            isOver={isOver}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            registerItemRef={registerItemRef}
          />
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 bg-gradient-to-t from-bg via-bg/95 to-transparent px-4 pb-3 pt-6">
        <div className={`mx-auto ${SHELL_MAX_W}`}>
          <Button
            size="lg"
            className="w-full"
            onClick={handleSave}
            disabled={saving || !title.trim() || days.length === 0}
          >
            {saving
              ? t('rutinas.guardando')
              : editing
                ? t('rutinas.builder.guardarCambios')
                : t('rutinas.builder.crearRutina')}
          </Button>
        </div>
      </div>

      {pickingDay !== null ? (
        <ExercisePicker
          onInspect={(ex) => {
            setPickingDay(null)
            void navigate(`/ejercicios/${ex.slug}`)
          }}
          onAdd={(ex) => {
            addItemToDay(pickingDay, ex)
            setPickingDay(null)
          }}
          onClose={() => setPickingDay(null)}
        />
      ) : null}
    </div>
  )
}
