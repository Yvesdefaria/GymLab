// Página de sesión activa (/entrenamiento/active): composición B2; la lógica vive en useActiveSession.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal, Plus, Save, Scale } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { SHELL_MAX_W } from '@/components/layout/shellWidth'
import { RestTimer } from '@/components/workout/RestTimer'
import { SessionActionsSheet } from '@/components/workout/SessionActionsSheet'
import { SessionHeaderNote } from '@/components/session/SessionHeaderNote'
import { SessionProgress } from '@/components/workout/SessionProgress'
import { WarmupFlow } from '@/components/warmup/WarmupFlow'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { PlateCalculatorModal } from '@/components/workout/PlateCalculatorModal'
import { SessionSummaryView } from '@/components/workout/SessionSummaryView'
import { SessionCarousel } from '@/components/workout/SessionCarousel'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { UndoToast } from '@/components/ui/UndoToast'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import { useActiveSession } from '@/hooks/useActiveSession'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { useBodyWeight } from '@/hooks/useBodyWeight'
import { useRecentLoadHistory } from '@/hooks/useRecentLoadHistory'
import { useElapsedClock } from '@/hooks/useElapsedClock'
import { formatUnits } from '@/domain/settings'
import { isDeloadActive } from '@/domain/deload'

// Alto asumido de las barras fijas (F113/B2): rest bar + una fila de sesión.
const SESSION_BAR_PADDING_CLASS = 'pb-48'
const SESSION_BAR_TOAST_OFFSET = 'bottom-[calc(4.5rem+env(safe-area-inset-bottom)+9.5rem)]'

// Sesión activa: todo el flujo de registro reside en activeWorkoutStore (Zustand) y useActiveSession.
export const EntrenamientoPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { program } = useActiveProgram()
  const deloadActive = program
    ? isDeloadActive(program.deloadActive, program.deloadUntil)
    : false
  // El peso corporal se consulta UNA vez a nivel de página y se reparte a todos los bloques
  // (antes cada ExerciseBlock tenía su propia liveQuery; tarea 91.2).
  const { today: bodyWeight } = useBodyWeight()
  // Historial de carga reciente: UNA consulta acotada a nivel de página (F97.4), repartida
  // como Map<exerciseId, promedioKg> a los bloques y al overlay.
  const { loadAverages, setsByExercise } = useRecentLoadHistory()
  const {
    exercises,
    startedAt,
    totalVolume,
    completedSets,
    totalSets,
    pct,
    suggestions,
    dayProposalByExercise,
    lastCompletedExercise,
    routineObjective,
    saving,
    showPicker,
    showPlates,
    confirmLeave,
    zeroWeightConfirm,
    showWarmup,
    summary,
    units,
    prMap,
    showRpe,
    showRir,
    showLoadSuggestion,
    categoryFor,
    slugFor,
    noteFor,
    completeExercise,
    openPicker,
    closePicker,
    openPlates,
    closePlates,
    handleSetCompleted,
    handleAddExercise,
    handleRemoveExercise,
    handleRemoveSet,
    handleApplyWeight,
    handleAddWarmup,
    handleApplyEscalada,
    handleFinish,
    handleLeave,
    confirmLeaveConfirm,
    cancelLeave,
    confirmZeroWeight,
    cancelZeroWeight,
    closeWarmup,
  } = useActiveSession(setsByExercise)

  const elapsed = useElapsedClock(startedAt)
  const [showSessionActions, setShowSessionActions] = useState(false)
  const completedExercises = exercises.filter(
    (ex) => ex.sets.length > 0 && ex.sets.every((s) => s.completed)
  ).length

  // Pantalla de resumen: se delega al componente dedicado.
  if (summary) {
    return (
      <SessionSummaryView
        workoutId={summary.workoutId}
        totalVolume={summary.totalVolume}
        completedSets={summary.completedSets}
        totalSets={summary.totalSets}
        durationMin={summary.durationMin}
        prCount={summary.prCount}
        exerciseCount={summary.exerciseCount}
        streak={summary.streak}
        skippedSets={summary.skippedSets}
        units={formatUnits(units)}
        unitKey={units}
      />
    )
  }

  return (
    <div>
      <AppHeader
        kicker={elapsed ? `${t('session.enCurso')} · ${elapsed}` : t('session.enCurso')}
        title={t('session.titulo')}
        actions={
          <button
            type="button"
            onClick={() => setShowSessionActions(true)}
            aria-label={t('session.masOpciones')}
            className="flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:text-gold"
          >
            <MoreHorizontal className="size-5" aria-hidden />
          </button>
        }
      />
      {/* Con barra fija, el contenido suma espacio inferior para que no tape el último slide. */}
      <div className={`space-y-3 p-4 ${exercises.length > 0 ? SESSION_BAR_PADDING_CLASS : 'pb-8'}`}>
        <SessionProgress
          pct={pct}
          totalVolume={totalVolume}
          units={units}
          completedSets={completedSets}
          totalSets={totalSets}
          completedExercises={completedExercises}
          exerciseCount={exercises.length}
        />

        {exercises.length === 0 && (
          <EmptyState
            tone="accent"
            size="lg"
            title={t('session.empecemos')}
            message={t('session.primerEjercicio')}
          />
        )}

        {exercises.length > 0 && (
          <SessionCarousel
            exercises={exercises}
            prMap={prMap}
            showRpe={showRpe}
            showRir={showRir}
            showLoadSuggestion={showLoadSuggestion}
            units={units}
            categoryFor={categoryFor}
            slugFor={slugFor}
            noteFor={noteFor}
            deloadActive={deloadActive}
            bodyWeight={bodyWeight}
            loadAverages={loadAverages}
            suggestions={suggestions}
            dayProposals={dayProposalByExercise}
            onApplyEscalada={handleApplyEscalada}
            onSuggestionApply={handleApplyWeight}
            onSuggestionWarmup={handleAddWarmup}
            onCompleteExercise={completeExercise}
            onSetCompleted={handleSetCompleted}
            onRemoveRequest={handleRemoveExercise}
            onSetRemoveRequest={handleRemoveSet}
          />
        )}

        {/* Sesión vacía: el alta va en flujo (la barra recién aparece con ≥1 ejercicio). */}
        {exercises.length === 0 && (
          <button
            onClick={openPicker}
            className="flex min-h-14 w-full items-center justify-center gap-2 border-t border-border/40 text-sm font-medium text-muted transition-colors hover:text-accent-soft"
          >
            <Plus className="size-5" aria-hidden />
            {t('session.anadirEjercicio')}
          </button>
        )}

        <div className="border-t border-border/40 pt-3">
          <SessionHeaderNote />
        </div>

        <button
          onClick={openPlates}
          className="flex min-h-11 w-full items-center gap-2 border-t border-border/40 text-sm text-muted transition-colors hover:text-accent-soft"
        >
          <Scale className="size-4" aria-hidden />
          {t('session.calculadoraDiscos')}
        </button>
      </div>

      {/* Descanso: barra fija sobre la session bar; el ⋯ abre el sheet. */}
      <RestTimer
        muscleGroup={lastCompletedExercise?.muscleGroup}
        exerciseName={lastCompletedExercise?.exerciseName}
        rpe={lastCompletedExercise?.rpe}
        rir={lastCompletedExercise?.rir}
        objective={routineObjective}
      />

      {/* Barra fija sobre la TabBar global. Una sola fila: acción secundaria + primaria. */}
      {exercises.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4 pb-3">
          <div className={`mx-auto flex ${SHELL_MAX_W} items-center gap-2`}>
            <button
              onClick={openPicker}
              className="flex min-h-[46px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-bg px-3 text-xs font-medium text-muted transition-colors hover:border-cta hover:text-accent-soft"
            >
              <Plus className="size-4" aria-hidden />
              {t('session.anadirEjercicio')}
            </button>
            <Button size="lg" className="flex-1" onClick={handleFinish} disabled={saving}>
              <Save className="size-5" aria-hidden />
              {saving ? t('session.guardando') : t('session.finalizarEntreno')}
            </Button>
          </div>
        </div>
      )}

      {showPicker && (
        <ExercisePicker
          onInspect={(ex) => {
            closePicker()
            void navigate(`/ejercicios/${ex.slug}`)
          }}
          onAdd={(ex) => void handleAddExercise(ex.id, ex.name)}
          onClose={closePicker}
        />
      )}

      {showPlates && (
        <PlateCalculatorModal
          initialKg={0}
          onClose={closePlates}
        />
      )}

      {showSessionActions && (
        <SessionActionsSheet
          onLeave={() => {
            setShowSessionActions(false)
            handleLeave()
          }}
          onClose={() => setShowSessionActions(false)}
        />
      )}

      {confirmLeave && (
        <ConfirmSheet
          title={t('session.salirSinGuardar')}
          message={t('session.salirSinGuardarMensaje')}
          confirmLabel={t('session.salir')}
          cancelLabel={t('session.seguirEntrenando')}
          onConfirm={confirmLeaveConfirm}
          onCancel={cancelLeave}
        />
      )}

      {zeroWeightConfirm > 0 && (
        <ConfirmSheet
          title={t('session.seriesSinPeso')}
          message={t('session.seriesSinPesoMensaje', { count: zeroWeightConfirm })}
          confirmLabel={t('session.guardarIgualmente')}
          cancelLabel={t('session.revisarSeries')}
          onConfirm={confirmZeroWeight}
          onCancel={cancelZeroWeight}
        />
      )}

      {showWarmup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 p-4">
          <WarmupFlow onDone={closeWarmup} />
        </div>
      )}

      {/* Elevado sobre la barra fija para no tapar sus botones; con la sesión vacía
          (sin barra) vuelve al offset por defecto (sobre la TabBar). */}
      <UndoToast offsetClass={exercises.length > 0 ? SESSION_BAR_TOAST_OFFSET : undefined} />
    </div>
  )
}
