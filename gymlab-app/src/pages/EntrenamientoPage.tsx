// Página de sesión activa (/entrenamiento/:id): composición de la UI; la lógica vive en useActiveSession.
import { useTranslation } from 'react-i18next'
import { Plus, Save, Scale } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { RestTimer } from '@/components/workout/RestTimer'
import { WarmupFlow } from '@/components/warmup/WarmupFlow'
import { SessionSuggestions } from '@/components/session/SessionSuggestions'
import { AdaptiveSuggestions } from '@/components/adaptive/AdaptiveSuggestions'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { PlateCalculatorModal } from '@/components/workout/PlateCalculatorModal'
import { SessionSummaryView } from '@/components/workout/SessionSummaryView'
import { SessionGroupList } from '@/components/workout/SessionGroupList'
import { SessionHero } from '@/components/workout/SessionHero'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { UndoToast } from '@/components/ui/UndoToast'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import { useActiveSession } from '@/hooks/useActiveSession'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { useBodyWeight } from '@/hooks/useBodyWeight'
import { formatUnits } from '@/domain/settings'
import { isDeloadActive } from '@/domain/deload'

// Sesión activa: todo el flujo de registro reside en activeWorkoutStore (Zustand) y useActiveSession.
export const EntrenamientoPage = () => {
  const { t } = useTranslation()
  const { program } = useActiveProgram()
  const deloadActive = program
    ? isDeloadActive(program.deloadActive, program.deloadUntil)
    : false
  // El peso corporal se consulta UNA vez a nivel de página y se reparte a todos los bloques
  // (antes cada ExerciseBlock tenía su propia liveQuery; tarea 91.2).
  const { today: bodyWeight } = useBodyWeight()
  const {
    exercises,
    startedAt,
    totalVolume,
    completedSets,
    totalSets,
    pct,
    suggestionSets,
    adaptiveSuggestions,
    knownE1RM,
    activeSetsInput,
    lastCompletedExercise,
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
    routineObjective,
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
    handleFinish,
    handleLeave,
    confirmLeaveConfirm,
    cancelLeave,
    confirmZeroWeight,
    cancelZeroWeight,
    closeWarmup,
  } = useActiveSession()

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
        title={t('session.titulo')}
        subtitle={t('session.subtitulo', {
          count: exercises.length,
          completadas: completedSets,
          total: totalSets,
        })}
      />
      <div className="space-y-3 p-4 pb-8">
        <BackLink to="/" onClick={handleLeave} />

        <SessionHero pct={pct} totalVolume={totalVolume} units={units} startedAt={startedAt} />

        <RestTimer
          muscleGroup={lastCompletedExercise?.muscleGroup}
          exerciseName={lastCompletedExercise?.exerciseName}
          rpe={lastCompletedExercise?.rpe}
          rir={lastCompletedExercise?.rir}
          objective={routineObjective}
        />

        <div className="flex justify-end">
          <button
            onClick={openPlates}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border bg-bg-elevated px-3 text-xs font-medium text-muted transition-colors hover:border-cta hover:text-accent-soft"
          >
            <Scale className="size-4" aria-hidden />
            {t('session.calculadoraDiscos')}
          </button>
        </div>

        {exercises.length === 0 && (
          <EmptyState
            tone="accent"
            size="lg"
            title={t('session.empecemos')}
            message={t('session.primerEjercicio')}
          />
        )}

        {adaptiveSuggestions.length > 0 && exercises.length > 0 && (
          <AdaptiveSuggestions suggestions={adaptiveSuggestions} />
        )}

        <SessionGroupList
          exercises={exercises}
          prMap={prMap}
          showRpe={showRpe}
          showRir={showRir}
          units={units}
          categoryFor={categoryFor}
          slugFor={slugFor}
          noteFor={noteFor}
          deloadActive={deloadActive}
          bodyWeight={bodyWeight}
          onCompleteExercise={completeExercise}
          onSetCompleted={handleSetCompleted}
          onRemoveRequest={handleRemoveExercise}
          onSetRemoveRequest={handleRemoveSet}
        />

        {suggestionSets.length >= 2 && (
          <SessionSuggestions
            completedSets={suggestionSets}
            knownE1RM={knownE1RM}
            activeSets={activeSetsInput}
            onApplyWeight={handleApplyWeight}
            onAddWarmup={handleAddWarmup}
          />
        )}

        <button
          onClick={openPicker}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gold/40 bg-bg-elevated/50 text-sm font-medium text-muted transition-colors hover:border-cta hover:text-accent-soft"
        >
          <Plus className="size-5" />
          {t('session.anadirEjercicio')}
        </button>

        {exercises.length > 0 && (
          <Button
            size="lg"
            className="w-full"
            onClick={handleFinish}
            disabled={saving}
          >
            <Save className="size-5" />
            {saving ? t('session.guardando') : t('session.finalizarEntreno')}
          </Button>
        )}
      </div>

      {showPicker && (
        <ExercisePicker
          onSelect={(ex) => void handleAddExercise(ex.id, ex.name)}
          onClose={closePicker}
        />
      )}

      {showPlates && (
        <PlateCalculatorModal
          initialKg={0}
          onClose={closePlates}
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

      <UndoToast />
    </div>
  )
}