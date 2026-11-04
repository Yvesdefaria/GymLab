// Tab de entrenamiento: solo monta hooks de entreno cuando está activo.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, Dumbbell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EntrenamientoStats } from '@/components/stats/EntrenamientoStats'
import { MuscleVolumeSection } from '@/components/frequency/MuscleVolumeSection'
import { PushPullBalanceView } from '@/components/balance/PushPullBalanceView'
import { useWorkoutSummary } from '@/hooks/useWorkoutSummary'
import { useAchievementsData } from '@/hooks/useAchievementsData'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { useLiveList } from '@/hooks/useLiveList'
import { useProfile } from '@/hooks/useProfile'
import { sessionJournalRepo } from '@/data/repositories'
import type { MuscleGroup } from '@/domain/types'

export const EntrenoTab = () => {
  const { t } = useTranslation()
  const summary = useWorkoutSummary()
  const { workouts } = summary
  // F91/L3a: las series salen de la capa única (solo completadas, scan único
  // compartido, F103/T6) en vez de una lectura propia de workoutSets.
  const { completedSets: sets } = useAchievementsData()
  const { exercises } = useExerciseCatalog()
  const journals = useLiveList(() => sessionJournalRepo.getAll())
  const profile = useProfile()

  const workoutsById = useMemo(() => new Map(workouts.map((w) => [w.id, w])), [workouts])
  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])
  const weeklyGoal = profile?.weeklyGoal ?? 3

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

  if (!hasData) {
    return (
      <div className="flex flex-col gap-4">
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
        {/* El tour y la lectura de volumen/balance siguen disponibles sin datos. */}
        <MuscleVolumeSection sets={sets} workouts={workouts} workoutsById={workoutsById} exercises={exercises} />
        <PushPullBalanceView volumeByMuscle={volumeByMuscle} />
      </div>
    )
  }

  return (
    <EntrenamientoStats
      workouts={workouts}
      sets={sets}
      workoutsById={workoutsById}
      exercises={exercises}
      summary={summary}
      weeklyGoal={weeklyGoal}
      journals={journals}
      volumeByMuscle={volumeByMuscle}
    />
  )
}
