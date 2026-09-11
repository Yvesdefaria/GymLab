// Tab de entrenamiento: solo monta hooks de entreno cuando está activo.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, Dumbbell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EntrenamientoStats } from '@/components/stats/EntrenamientoStats'
import { MuscleFrequencyView } from '@/components/frequency/MuscleFrequencyView'
import { PushPullBalanceView } from '@/components/balance/PushPullBalanceView'
import { useWorkoutSummary } from '@/hooks/useWorkoutSummary'
import { useWorkoutSets } from '@/hooks/useWorkoutSets'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { useLiveList } from '@/hooks/useLiveList'
import { useProfile } from '@/hooks/useProfile'
import { sessionJournalRepo } from '@/data/repositories'
import type { MuscleGroup } from '@/domain/types'

export const EntrenoTab = () => {
  const { t } = useTranslation()
  const summary = useWorkoutSummary()
  const { workouts } = summary
  const { sets } = useWorkoutSets()
  const { exercises } = useExerciseCatalog()
  const journals = useLiveList(() => sessionJournalRepo.getAll())
  const profile = useProfile()

  const workoutsById = useMemo(() => new Map(workouts.map((w) => [w.id, w])), [workouts])
  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])
  const weeklyGoal = profile?.weeklyGoal ?? 3

  // Frecuencia muscular: cuenta días únicos por grupo muscular en la última semana.
  const muscleFrequency = useMemo(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekStartStr = weekStart.toISOString().slice(0, 10)

    const groupDays = new Map<MuscleGroup, Set<string>>()
    for (const set of sets) {
      if (!set.completed) continue
      const workout = workoutsById.get(set.workoutId)
      if (!workout) continue
      const localDate = (workout as { localDate?: string }).localDate ?? workout.finishedAt?.slice(0, 10) ?? ''
      if (localDate < weekStartStr) continue
      const exercise = exerciseById.get(set.exerciseId)
      if (!exercise) continue
      const group = exercise.muscleGroup
      if (!groupDays.has(group)) groupDays.set(group, new Set())
      groupDays.get(group)!.add(localDate)
    }

    const result: Partial<Record<MuscleGroup, number>> = {}
    for (const [group, days] of groupDays) {
      result[group] = days.size
    }
    return result
  }, [sets, workoutsById, exerciseById])

  // Volumen por grupo muscular (para balance push/pull/legs).
  const volumeByMuscle = useMemo(() => {
    const totals = new Map<MuscleGroup, number>()
    for (const set of sets) {
      if (!set.completed || set.weightKg <= 0 || set.reps <= 0) continue
      const exercise = exerciseById.get(set.exerciseId)
      if (!exercise) continue
      const vol = set.weightKg * set.reps
      totals.set(exercise.muscleGroup, (totals.get(exercise.muscleGroup) ?? 0) + vol)
    }
    const result: Partial<Record<MuscleGroup, number>> = {}
    for (const [group, volume] of totals) {
      result[group] = volume
    }
    return result
  }, [sets, exerciseById])

  const hasData = workouts.length > 0

  return (
    <div className="space-y-4">
      {hasData ? (
        <EntrenamientoStats
          workouts={workouts}
          sets={sets}
          workoutsById={workoutsById}
          exercises={exercises}
          summary={summary}
          weeklyGoal={weeklyGoal}
          journals={journals}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-gold/40 bg-bg-elevated/50 p-8 text-center">
          <BarChart3 className="mx-auto mb-3 size-8 text-cta" aria-hidden />
          <p className="font-display text-base font-semibold text-fg">
            {t('estadisticas.sinDatosTitulo')}
          </p>
          <p className="mt-1 text-sm text-muted">
            {t('estadisticas.sinDatosTexto')}
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-cta px-5 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90"
          >
            <Dumbbell className="size-4" aria-hidden />
            {t('estadisticas.empezarEntrenar')}
          </Link>
        </div>
      )}
      <MuscleFrequencyView frequency={muscleFrequency} />
      <PushPullBalanceView volumeByMuscle={volumeByMuscle} />
    </div>
  )
}
