// Comparación de sesiones: selectores + carga de series + compareSessions + render.
// Delega la tabla y las barras en componentes presentacionales para no crecer de más.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeftRight } from 'lucide-react'
import { useLiveList } from '@/hooks/useLiveList'
import { bodyWeightRepo, routineRepo, workoutSetRepo } from '@/data/repositories'
import { compareSessions } from '@/domain/sessionComparison'
import { ComparisonMetricTable } from './ComparisonMetricTable'
import { MuscleGroupBars } from './MuscleGroupBars'
import type { Units } from '@/domain/settings'
import type { Exercise, PRRecord, Workout } from '@/domain/types'

interface SessionComparisonProps {
  workouts: Workout[]
  prs: PRRecord[]
  exerciseById: ReadonlyMap<number, Exercise>
  units: Units
}

interface PickerOption {
  id: number
  label: string
}

const PickerSelect = ({
  ariaLabel,
  testId,
  value,
  onChange,
  options,
}: {
  ariaLabel: string
  testId: string
  value: number | null
  onChange: (id: number) => void
  options: PickerOption[]
}) => (
  <select
    aria-label={ariaLabel}
    data-testid={testId}
    className="min-h-11 min-w-0 flex-1 touch-manipulation rounded-lg border border-border/30 bg-bg-elevated/30 px-2 py-1.5 text-xs text-fg"
    value={value ?? ''}
    onChange={(e) => onChange(Number(e.target.value))}
  >
    {options.map((option) => (
      <option key={option.id} value={option.id}>
        {option.label}
      </option>
    ))}
  </select>
)

export const SessionComparison = ({ workouts, prs, exerciseById, units }: SessionComparisonProps) => {
  const { t } = useTranslation()
  // `workouts` llega más reciente primero: el índice 1 es la sesión anterior.
  const [olderId, setOlderId] = useState<number | null>(workouts[1]?.id ?? null)
  const [newerId, setNewerId] = useState<number | null>(workouts[0]?.id ?? null)

  const olderWorkout = workouts.find((w) => w.id === olderId)
  const newerWorkout = workouts.find((w) => w.id === newerId)

  // Rutinas por id (el repo no tiene getMany): se leen solo los ids distintos.
  const routineIds = useMemo(
    () => [...new Set(workouts.map((w) => w.routineId).filter((id): id is number => id !== null))],
    [workouts]
  )
  const routines = useLiveList(
    () => Promise.all(routineIds.map((id) => routineRepo.getById(id))),
    [routineIds]
  )
  const routineNameById = useMemo(() => {
    const map = new Map<number, string>()
    for (const routine of routines) if (routine) map.set(routine.id, routine.title)
    return map
  }, [routines])

  const selectedIds = useMemo(
    () => [olderId, newerId].filter((id): id is number => id !== null),
    [olderId, newerId]
  )
  const sets = useLiveList(() => workoutSetRepo.getByWorkoutIds(selectedIds), [selectedIds])
  // Peso corporal para estimar las calorías de cada sesión (la comparativa no lo persiste).
  const bodyWeightEntries = useLiveList(() => bodyWeightRepo.getAll(), [])

  const result = useMemo(() => {
    if (!olderWorkout || !newerWorkout) return null
    return compareSessions({
      a: olderWorkout,
      aSets: sets.filter((s) => s.workoutId === olderWorkout.id),
      b: newerWorkout,
      bSets: sets.filter((s) => s.workoutId === newerWorkout.id),
      prs,
      exerciseById,
      bodyWeightEntries,
    })
  }, [olderWorkout, newerWorkout, sets, prs, exerciseById, bodyWeightEntries])

  // Header legible: rutina + fecha (la fecha sola es ambigua con dos sesiones el mismo día).
  const labelOf = (workout: Workout): string => {
    const name = workout.routineId !== null ? routineNameById.get(workout.routineId) : undefined
    return name ? `${name} · ${workout.localDate}` : workout.localDate
  }
  const options = workouts.map((w) => ({ id: w.id, label: labelOf(w) }))

  // Sin series de trabajo en alguna sesión no hay comparación útil: se evita la pared de ceros.
  const noWorkingSets =
    result !== null && (result.older.metrics.sets === 0 || result.newer.metrics.sets === 0)

  return (
    <div className="flex flex-col gap-3" data-testid="session-comparison">
      <div className="flex items-center gap-2">
        <ArrowLeftRight className="size-4 text-accent" aria-hidden />
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
          {t('compare.title')}
        </h2>
      </div>

      <div className="flex gap-2">
        <PickerSelect
          ariaLabel={t('compare.selectA')}
          testId="compare-select-older"
          value={olderId}
          onChange={setOlderId}
          options={options}
        />
        <PickerSelect
          ariaLabel={t('compare.selectB')}
          testId="compare-select-newer"
          value={newerId}
          onChange={setNewerId}
          options={options}
        />
      </div>

      {!result ? (
        <p className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-4 text-center text-xs text-muted">
          {t('compare.selectTwo')}
        </p>
      ) : noWorkingSets ? (
        <p
          data-testid="compare-empty"
          className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-4 text-center text-xs text-muted"
        >
          {t('compare.noSets')}
        </p>
      ) : (
        <>
          <ComparisonMetricTable
            result={result}
            olderLabel={labelOf(result.older.workout)}
            newerLabel={labelOf(result.newer.workout)}
            units={units}
          />
          <MuscleGroupBars
            older={result.older.metrics.muscleGroups}
            newer={result.newer.metrics.muscleGroups}
            units={units}
          />
        </>
      )}
    </div>
  )
}
