// Página /rutinas/nueva y /rutinas/:slug/editar: editor de rutinas propias (borrador en memoria).
// Composición fina: estado/borrador en useRoutineDraft, reorden por arrastre en useDragReorder y presentación en componentes.
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { RoutineDayEditor } from '@/components/routines/RoutineDayEditor'
import { RoutineInfoForm } from '@/components/routines/RoutineInfoForm'
import { useDragReorder } from '@/hooks/useDragReorder'
import { useRoutineDraft } from '@/hooks/useRoutineDraft'

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
          <div className="mt-4 panel rounded-2xl p-5 text-center">
            <p className="text-sm text-muted">{t('rutinas.builder.soloPropias')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHeader
        title={editing ? t('rutinas.builder.tituloEditar') : t('rutinas.builder.tituloNueva')}
        subtitle={t('rutinas.builder.subtitulo')}
      />
      <div className="space-y-4 p-4 pb-32">
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

        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-accent">{t('rutinas.builder.dias', { count: days.length })}</h2>
          <button
            type="button"
            onClick={addDay}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-cta bg-cta/15 px-3 text-sm font-medium text-accent-soft"
          >
            <Plus className="size-4" /> {t('rutinas.builder.anadirDia')}
          </button>
        </div>

        {days.map((day, dayIndex) => (
          <div
            key={dayIndex}
            ref={(el) => registerDayRef(`0-${dayIndex}`, el)}
            onPointerMove={(e) => onDayDragMove(0, e)}
            onPointerUp={onDayDragEnd}
            className={`rounded-2xl transition-all ${
              isDayDragging(0, dayIndex) ? 'opacity-70' : isDayOver(0, dayIndex) ? 'ring-2 ring-accent/50' : ''
            }`}
          >
            <RoutineDayEditor
              day={day}
              dayIndex={dayIndex}
              onRenameDay={(name) => updateDayName(dayIndex, name)}
              onRemoveDay={() => removeDay(dayIndex)}
              onPickExercise={() => setPickingDay(dayIndex)}
              onUpdateItem={(itemIndex, patch) => updateItem(dayIndex, itemIndex, patch)}
              onRemoveItem={(itemIndex) => removeItem(dayIndex, itemIndex)}
              dayDrag={days.length > 1 ? { onDragStart: (e) => onDayDragStart(0, dayIndex, e) } : undefined}
              drag={{
                isDragging: (itemIndex) => isDragging(dayIndex, itemIndex),
                isOver: (itemIndex) => isOver(dayIndex, itemIndex),
                onDragStart: (itemIndex, e) => onDragStart(dayIndex, itemIndex, e),
                onDragMove: (e) => onDragMove(dayIndex, e),
                onDragEnd,
                registerItemRef,
              }}
            />
          </div>
        ))}

        <Button
          size="lg"
          className="w-full"
          onClick={handleSave}
          disabled={saving || !title.trim() || days.length === 0}
        >
          {saving ? t('rutinas.guardando') : editing ? t('rutinas.builder.guardarCambios') : t('rutinas.builder.crearRutina')}
        </Button>
      </div>

      {pickingDay !== null ? (
        <ExercisePicker
          onSelect={(ex) => {
            addItemToDay(pickingDay, ex)
            setPickingDay(null)
          }}
          onClose={() => setPickingDay(null)}
        />
      ) : null}
    </div>
  )
}