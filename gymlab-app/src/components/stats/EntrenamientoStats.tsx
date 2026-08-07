import { useMemo, useState } from 'react'
import { Activity, CalendarDays, Clock, Flame, Timer, TrendingUp } from 'lucide-react'
import { StatCard } from './StatCard'
import { WeeklyGoalBullet } from './WeeklyGoalBullet'
import { ExercisePills } from './ExercisePills'
import { FrequencyChart } from './FrequencyChart'
import { VolumeByMuscleChart } from './VolumeByMuscleChart'
import { VolumeByMuscleDonut } from './VolumeByMuscleDonut'
import { LoadRangeCandlestick } from './LoadRangeCandlestick'
import { VolumeRangeCandlestick } from './VolumeRangeCandlestick'
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
  const [e1rmExerciseId, setE1rmExerciseId] = useState<number | null>(null)

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])

  const exercisesWithSets = useMemo(
    () => {
      const ids = new Set(sets.filter((s) => s.completed && s.weightKg > 0).map((s) => s.exerciseId))
      return exercises.filter((e) => ids.has(e.id))
    },
    [sets, exercises],
  )

  const activeE1rmId = e1rmExerciseId ?? exercisesWithSets[0]?.id ?? null

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
        <StatCard icon={Flame} label="Racha actual" value={currentStreak > 0 ? `${currentStreak} d` : '—'} tone="cta" />
        <StatCard icon={CalendarDays} label="Racha máxima" value={maxStreak > 0 ? `${maxStreak} d` : '—'} tone="accent" />
        <StatCard icon={Activity} label="Entrenos 30 d" value={String(days30)} />
        <StatCard icon={Timer} label="Duración media" value={avgDuration != null ? `${avgDuration} min` : '—'} tone="success" />
        <StatCard icon={TrendingUp} label="Volumen sem." value={volumeWeek > 0 ? formatVolume(volumeWeek) : '—'} tone="success" />
        <StatCard icon={Clock} label="Total entrenos" value={String(workouts.length)} />
      </div>

      <div className="panel rounded-2xl p-4">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          Objetivo semanal
        </h2>
        <WeeklyGoalBullet workoutsThisWeek={thisWeek} weeklyGoal={weeklyGoal} />
      </div>

      <div className="panel rounded-2xl p-4">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          Volumen por semana
        </h2>
        <VolumeChart workouts={workouts} />
      </div>

      <div className="panel rounded-2xl p-4">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          Frecuencia semanal
        </h2>
        <FrequencyChart points={frequency} />
      </div>

      <div className="panel rounded-2xl p-4">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          Volumen por grupo muscular
        </h2>
        <VolumeByMuscleChart data={muscleVolume} />
        <VolumeByMuscleDonut data={muscleVolume} />
      </div>

      <div className="panel rounded-2xl p-4">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          Cargas por sesión
        </h2>
        <LoadRangeCandlestick sets={sets} workoutsById={workoutsById} exercises={exercisesWithSets} />
      </div>

      <div className="panel rounded-2xl p-4">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          Rango de volumen semanal
        </h2>
        <VolumeRangeCandlestick workouts={workouts} />
      </div>

      <div className="panel rounded-2xl p-4">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          Fuerza estimada (1RM)
        </h2>
        {exercisesWithSets.length > 0 ? (
          <>
            <ExercisePills
              options={exercisesWithSets.map((e) => ({ id: e.id, label: e.name }))}
              value={activeE1rmId}
              onChange={setE1rmExerciseId}
              ariaLabel="Elige ejercicio para 1RM"
            />
            <E1rmChart points={e1rmPoints} />
          </>
        ) : (
          <p className="py-4 text-center text-sm text-muted">
            Registra series con peso para ver la evolución de tu 1RM estimado.
          </p>
        )}
      </div>
    </>
  )
}
