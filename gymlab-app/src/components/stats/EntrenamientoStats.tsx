// Pestaña de entrenamiento (C1): héroe de volumen semanal, stats y stack de
// secciones con hairlines. Conserva todos los charts, rangos, help tips y el
// formulario/acciones existentes; Bitácora, Cardio y Balance viven en “Más datos”.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WeeklyGoalBullet } from './WeeklyGoalBullet'
import { ExercisePills } from './ExercisePills'
import { FrequencyChart } from './FrequencyChart'
import { VolumeByMuscleChart } from './VolumeByMuscleChart'
import { VolumeByMuscleDonut } from './VolumeByMuscleDonut'
import { LoadRangeChart } from './LoadRangeChart'
import { VolumeRangeChart } from './VolumeRangeChart'
import { CardioProgressChart } from './CardioProgressChart'
import { StatsHero } from './StatsHero'
import { StatsStatRow } from './StatsStatRow'
import { StatsSection } from './StatsSection'
import { StatsMoreData } from './StatsMoreData'
import { MuscleFrequencyView } from '@/components/frequency/MuscleFrequencyView'
import { PushPullBalanceView } from '@/components/balance/PushPullBalanceView'
import { VolumeChart } from '@/components/profile/VolumeChart'
import { E1rmChart } from '@/components/profile/E1rmChart'
import { JournalChart } from '@/components/journal/JournalChart'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatUnits } from '@/domain/settings'
import { buildVolumeHero } from '@/domain/statsOverview'
import {
  cardioExercisesWithData,
  volumeByMuscleGroup,
  weeklyFrequency,
  workoutsInCurrentWeek,
} from '@/domain/trainingStats'
import { buildE1rmSeries } from '@/domain/e1rm'
import { formatNumber } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type {
  Exercise,
  MuscleGroup,
  Workout,
  WorkoutSet,
  SessionJournalEntry,
} from '@/domain/types'
import type { useWorkoutSummary } from '@/hooks/useWorkoutSummary'

type Props = {
  workouts: Workout[]
  sets: WorkoutSet[]
  workoutsById: ReadonlyMap<number, Workout>
  exercises: Exercise[]
  summary: ReturnType<typeof useWorkoutSummary>
  weeklyGoal: number
  journals?: SessionJournalEntry[]
  muscleFrequency: Partial<Record<MuscleGroup, number>>
  volumeByMuscle: Partial<Record<MuscleGroup, number>>
}

export const EntrenamientoStats = ({
  workouts,
  sets,
  workoutsById,
  exercises,
  summary,
  weeklyGoal,
  journals = [],
  muscleFrequency,
  volumeByMuscle,
}: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { settings } = useSettings()
  const [e1rmExerciseId, setE1rmExerciseId] = useState<number | null>(null)

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])

  const exercisesWithSets = useMemo(() => {
    const ids = new Set(
      sets.filter((s) => s.completed && s.weightKg > 0).map((s) => s.exerciseId),
    )
    return exercises.filter((e) => ids.has(e.id))
  }, [sets, exercises])

  // Cardio por categoría de catálogo + datos reales, no por tener duración.
  const cardioExercises = useMemo(
    () => cardioExercisesWithData(sets, exercises),
    [sets, exercises],
  )

  const activeE1rmId = e1rmExerciseId ?? exercisesWithSets[0]?.id ?? null

  const e1rmPoints = useMemo(() => {
    if (activeE1rmId == null) return []
    const exerciseSets = sets.filter((s) => s.exerciseId === activeE1rmId)
    return buildE1rmSeries(exerciseSets, workoutsById)
  }, [sets, workoutsById, activeE1rmId])

  const thisWeek = workoutsInCurrentWeek(workouts)
  const frequency = useMemo(() => weeklyFrequency(workouts), [workouts])
  const muscleVolume = useMemo(
    () => volumeByMuscleGroup(sets, workoutsById, exerciseById),
    [sets, workoutsById, exerciseById],
  )
  const hero = useMemo(() => buildVolumeHero(workouts), [workouts])
  const volumeValue = formatNumber(
    Math.round(applyUnits(hero.current, settings.units)),
    lang,
  )
  const volumeUnit = formatUnits(settings.units)
  const deltaPct = hero.deltaPct
  const delta =
    deltaPct != null
      ? t('stats.deltaVsPrevWeek', {
          pct: `${deltaPct > 0 ? '+' : ''}${Math.round(deltaPct)}`,
        })
      : undefined
  const deltaTone: 'progress' | 'muted' =
    deltaPct != null && deltaPct < 0 ? 'muted' : 'progress'

  const mainStats = [
    {
      value:
        summary.currentStreak > 0
          ? t('stats.diasCorto', { count: summary.currentStreak })
          : '—',
      label: t('stats.rachaActual'),
      color: 'bg-success',
    },
    {
      value: String(summary.days30),
      label: t('stats.entrenos30d'),
      color: 'bg-gold',
    },
    {
      value:
        summary.avgDuration != null
          ? t('stats.minSufijo', { min: summary.avgDuration })
          : '—',
      label: t('stats.duracionMedia'),
      color: 'bg-data-cardio',
    },
  ]

  const secondaryStats = [
    {
      value:
        summary.maxStreak > 0
          ? t('stats.diasCorto', { count: summary.maxStreak })
          : '—',
      label: t('stats.rachaMaxima'),
      color: 'bg-success',
    },
    {
      value: String(summary.totalWorkouts),
      label: t('stats.totalEntrenos'),
      color: 'bg-gold',
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <StatsHero
        eyebrow={t('stats.heroVolumenSemanal')}
        value={volumeValue}
        unit={volumeUnit}
        delta={delta}
        deltaTone={deltaTone}
      />
      <StatsStatRow items={mainStats} />
      <StatsStatRow items={secondaryStats} columns={2} />

      <section className="border-t border-border/40 pt-4">
        <WeeklyGoalBullet workoutsThisWeek={thisWeek} weeklyGoal={weeklyGoal} />
      </section>

      <StatsSection title={t('stats.volumenSemana')} help="volumen">
        <VolumeChart workouts={workouts} />
      </StatsSection>

      <FrequencyChart points={frequency} weeklyGoal={weeklyGoal} />
      <VolumeByMuscleChart data={muscleVolume} />
      <VolumeByMuscleDonut data={muscleVolume} />
      <MuscleFrequencyView frequency={muscleFrequency} />
      <LoadRangeChart sets={sets} workoutsById={workoutsById} exercises={exercisesWithSets} />
      <VolumeRangeChart workouts={workouts} />

      {exercisesWithSets.length > 0 ? (
        <E1rmChart
          points={e1rmPoints}
          selector={
            <ExercisePills
              options={exercisesWithSets.map((e) => ({ id: e.id, label: e.name }))}
              value={activeE1rmId}
              onChange={setE1rmExerciseId}
              ariaLabel={t('stats.elegirEjercicio1rm')}
            />
          }
        />
      ) : (
        <E1rmChart points={[]} />
      )}

      <StatsMoreData title={t('stats.moreData')} hint={t('stats.moreDataHint')}>
        {journals.length > 0 ? (
          <JournalChart journals={journals} workouts={workouts} />
        ) : null}
        {cardioExercises.map((ex) => (
          <CardioProgressChart
            key={ex.id}
            sets={sets}
            workouts={workouts}
            exerciseId={ex.id}
            title={ex.name}
          />
        ))}
        <PushPullBalanceView volumeByMuscle={volumeByMuscle} />
      </StatsMoreData>
    </div>
  )
}
