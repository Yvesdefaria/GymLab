// Pestaña de estadísticas de entrenamiento: resumen, objetivos, volúmenes, frecuencias, cargas y 1RM.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Activity, CalendarDays, Clock, Flame, Timer, TrendingUp } from 'lucide-react'
import { StatCard } from './StatCard'
import { WeeklyGoalBullet } from './WeeklyGoalBullet'
import { ExercisePills } from './ExercisePills'
import { FrequencyChart } from './FrequencyChart'
import { VolumeByMuscleChart } from './VolumeByMuscleChart'
import { VolumeByMuscleDonut } from './VolumeByMuscleDonut'
import { LoadRangeChart } from './LoadRangeChart'
import { VolumeRangeChart } from './VolumeRangeChart'
import { VolumeChart } from '@/components/profile/VolumeChart'
import { E1rmChart } from '@/components/profile/E1rmChart'
import {
  avgSessionDurationMin,
  maxStreakDays,
  trainedDaysInLast,
  volumeByMuscleGroup,
  weeklyFrequency,
  workoutsInCurrentWeek,
} from '@/domain/trainingStats'
import { buildE1rmSeries } from '@/domain/e1rm'
import { weeklyVolume } from '@/domain/workouts'
import { formatVolume } from '@/domain/volume'
import type { Exercise, Workout, WorkoutSet } from '@/domain/types'

type Props = {
  workouts: Workout[]
  sets: WorkoutSet[]
  workoutsById: ReadonlyMap<number, Workout>
  exercises: Exercise[]
  currentStreak: number
  weeklyGoal: number
}

export const EntrenamientoStats = ({ workouts, sets, workoutsById, exercises, currentStreak, weeklyGoal }: Props) => {
  const { t } = useTranslation()
  const [e1rmExerciseId, setE1rmExerciseId] = useState<number | null>(null)

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])

  // Solo ejercicios con al menos una serie completada con peso (útiles para 1RM y selector).
  const exercisesWithSets = useMemo(
    () => {
      const ids = new Set(sets.filter((s) => s.completed && s.weightKg > 0).map((s) => s.exerciseId))
      return exercises.filter((e) => ids.has(e.id))
    },
    [sets, exercises],
  )

  // Ejercicio activo del selector de 1RM; por defecto el primero con series registradas.
  const activeE1rmId = e1rmExerciseId ?? exercisesWithSets[0]?.id ?? null

  // Serie de 1RM estimado del ejercicio elegido, construida sobre sus sets ordenados por fecha.
  const e1rmPoints = useMemo(() => {
    if (activeE1rmId == null) return []
    const exerciseSets = sets.filter((s) => s.exerciseId === activeE1rmId)
    return buildE1rmSeries(exerciseSets, workoutsById)
  }, [sets, workoutsById, activeE1rmId])

  const maxStreak = maxStreakDays(workouts)
  const days30 = trainedDaysInLast(workouts, 30)
  const avgDuration = avgSessionDurationMin(workouts)
  const volumeWeek = weeklyVolume(workouts)
  const thisWeek = workoutsInCurrentWeek(workouts)
  const frequency = useMemo(() => weeklyFrequency(workouts), [workouts])
  const muscleVolume = useMemo(() => volumeByMuscleGroup(sets, workoutsById, exerciseById), [sets, workoutsById, exerciseById])

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Flame} label={t('stats.rachaActual')} value={currentStreak > 0 ? t('stats.diasCorto', { count: currentStreak }) : '—'} tone="cta" />
        <StatCard icon={CalendarDays} label={t('stats.rachaMaxima')} value={maxStreak > 0 ? t('stats.diasCorto', { count: maxStreak }) : '—'} tone="accent" />
        <StatCard icon={Activity} label={t('stats.entrenos30d')} value={String(days30)} />
        <StatCard icon={Timer} label={t('stats.duracionMedia')} value={avgDuration != null ? t('stats.minSufijo', { min: avgDuration }) : '—'} tone="success" />
        <StatCard icon={TrendingUp} label={t('stats.volumenSem')} value={volumeWeek > 0 ? formatVolume(volumeWeek) : '—'} tone="success" />
        <StatCard icon={Clock} label={t('stats.totalEntrenos')} value={String(workouts.length)} />
      </div>

      <div className="panel-light rounded-2xl p-4">
        <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          {t('stats.objetivoSemanal')}
        </h2>
        <WeeklyGoalBullet workoutsThisWeek={thisWeek} weeklyGoal={weeklyGoal} />
      </div>

      <div className="panel-light rounded-2xl p-4">
        <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          {t('stats.volumenSemana')}
        </h2>
        <VolumeChart workouts={workouts} />
      </div>

      <div className="panel-light rounded-2xl p-4">
        <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          {t('stats.frecuenciaSemanal')}
        </h2>
        <FrequencyChart points={frequency} />
      </div>

      <div className="panel-light rounded-2xl p-4">
        <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          {t('stats.volumenMuscular')}
        </h2>
        <VolumeByMuscleChart data={muscleVolume} />
        <VolumeByMuscleDonut data={muscleVolume} />
      </div>

      <div className="panel-light rounded-2xl p-4">
        <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          {t('stats.cargasSesion')}
        </h2>
        <LoadRangeChart sets={sets} workoutsById={workoutsById} exercises={exercisesWithSets} />
      </div>

      <div className="panel-light rounded-2xl p-4">
        <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          {t('stats.rangoVolumen')}
        </h2>
        <VolumeRangeChart workouts={workouts} />
      </div>

      <div className="panel-light rounded-2xl p-4">
        <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          {t('stats.fuerzaEstimada')}
        </h2>
        {exercisesWithSets.length > 0 ? (
          <>
            <ExercisePills
              options={exercisesWithSets.map((e) => ({ id: e.id, label: e.name }))}
              value={activeE1rmId}
              onChange={setE1rmExerciseId}
              ariaLabel={t('stats.elegirEjercicio1rm')}
            />
            <E1rmChart points={e1rmPoints} />
          </>
        ) : (
          <p className="py-4 text-center text-sm text-muted">
            {t('stats.sinSeries1rm')}
          </p>
        )}
      </div>
    </>
  )
}
