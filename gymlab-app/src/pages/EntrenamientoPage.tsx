import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Save, Flame } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { ExerciseBlock } from '@/components/workout/ExerciseBlock'
import { RestTimer } from '@/components/workout/RestTimer'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { usePRs } from '@/hooks/usePRs'
import { workoutRepo, workoutSetRepo, prRepo } from '@/data/repositories'
import { estimate1RM } from '@/domain/prs'

export const EntrenamientoPage = () => {
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [finished, setFinished] = useState(false)

  const { exercises, startedAt, finishWorkout } = useActiveWorkoutStore()
  const { prMap } = usePRs()

  const handleFinish = async () => {
    if (saving || exercises.length === 0) return
    setSaving(true)

    const result = finishWorkout()
    if (!result) {
      setSaving(false)
      return
    }

    const workoutId = await workoutRepo.create({
      startedAt: startedAt ?? new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      routineId: null,
      notes: '',
      totalVolume: result.totalVolume,
    })

    // Save sets and update PRs
    for (const ex of exercises) {
      for (const set of ex.sets) {
        if (!set.completed) continue
        await workoutSetRepo.create({
          workoutId,
          exerciseId: ex.exerciseId,
          setNumber: set.setNumber,
          weightKg: set.weightKg,
          reps: set.reps,
          completed: true,
          createdAt: new Date().toISOString(),
        })

        // Check PR
        const e1rm = estimate1RM(set.weightKg, set.reps)
        const existing = prMap.get(ex.exerciseId)
        if (!existing || e1rm > existing.estimated1RM) {
          await prRepo.upsert({
            exerciseId: ex.exerciseId,
            weightKg: set.weightKg,
            reps: set.reps,
            date: new Date().toISOString(),
            estimated1RM: e1rm,
          })
        }
      }
    }

    setSaving(false)
    setFinished(true)
  }

  const totalVolume = exercises.reduce((acc, ex) => {
    return acc + ex.sets.reduce((s, set) => s + (set.completed ? set.weightKg * set.reps : 0), 0)
  }, 0)

  const completedSets = exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.completed).length, 0)
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0)

  if (finished) {
    return (
      <div>
        <AppHeader title="Entreno completado" />
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-success/20">
            <Flame className="size-8 text-success" />
          </div>
          <h2 className="font-display text-xl font-bold text-fg">¡Buen entreno!</h2>
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            <div className="rounded-xl border border-border bg-bg-elevated p-3">
              <p className="text-xs text-muted">Volumen</p>
              <p className="font-display text-lg font-bold text-accent">{totalVolume.toLocaleString()} kg</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-elevated p-3">
              <p className="text-xs text-muted">Series</p>
              <p className="font-display text-lg font-bold text-accent">{completedSets}/{totalSets}</p>
            </div>
          </div>
          <Link
            to="/"
            className="flex min-h-[48px] items-center justify-center rounded-xl bg-cta px-6 font-medium text-bg transition-opacity hover:opacity-90"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHeader title="Sesión" subtitle={`${exercises.length} ejercicios · ${completedSets}/${totalSets} series`} />
      <div className="space-y-3 p-4">
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver
        </Link>

        {/* Stats bar */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl border border-border bg-bg-elevated p-3">
            <p className="text-xs text-muted">Volumen</p>
            <p className="font-display text-lg font-bold text-accent">{totalVolume.toLocaleString()} kg</p>
          </div>
          <div className="flex-1 rounded-xl border border-border bg-bg-elevated p-3">
            <p className="text-xs text-muted">Tiempo</p>
            <p className="font-display text-lg font-bold text-accent">
              {startedAt
                ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000)
                : 0}m
            </p>
          </div>
        </div>

        {/* Rest Timer */}
        <RestTimer />

        {/* Exercise blocks */}
        {exercises.map((ex) => (
          <ExerciseBlock key={ex.exerciseId} exercise={ex} prMap={prMap} />
        ))}

        {/* Add exercise */}
        <button
          onClick={() => setShowPicker(true)}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-bg-elevated/50 text-sm font-medium text-muted transition-colors hover:border-accent/50 hover:text-accent"
        >
          <Plus className="size-5" />
          Añadir ejercicio
        </button>

        {/* Finish */}
        {exercises.length > 0 && (
          <button
            onClick={handleFinish}
            disabled={saving}
            className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-success text-bg font-display text-lg font-semibold tracking-wide transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Save className="size-5" />
            {saving ? 'Guardando...' : 'Finalizar entreno'}
          </button>
        )}
      </div>

      {showPicker && (
        <ExercisePicker
          onSelect={(ex) => {
            useActiveWorkoutStore.getState().addExercise(ex.id, ex.name)
            setShowPicker(false)
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
