import { useMemo, useState } from 'react'
import { CandlestickChart, type CandleDatum } from './CandlestickChart'
import { ExercisePills } from './ExercisePills'
import { buildLoadRangeSeries } from '@/domain/trainingStats'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatUnits } from '@/domain/settings'
import type { Exercise, Workout, WorkoutSet } from '@/domain/types'

type Props = {
  sets: WorkoutSet[]
  workoutsById: ReadonlyMap<number, Workout>
  exercises: Exercise[]
}

const loadLabel = (date: string): string =>
  new Date(date + 'T12:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })

export const LoadRangeCandlestick = ({ sets, workoutsById, exercises }: Props) => {
  const { settings } = useSettings()

  const withSets = useMemo(() => {
    const ids = new Set(sets.map((s) => s.exerciseId))
    return exercises.filter((e) => ids.has(e.id))
  }, [sets, exercises])

  const [exerciseId, setExerciseId] = useState<number | null>(null)
  const activeId = exerciseId ?? withSets[0]?.id ?? null
  const activeExercise = withSets.find((e) => e.id === activeId)

  const data = useMemo<CandleDatum[]>(() => {
    if (activeId == null) return []
    return buildLoadRangeSeries(sets, workoutsById, activeId).map((p) => ({
      ...p,
      label: loadLabel(p.date),
    }))
  }, [sets, workoutsById, activeId])

  const formatValue = (v: number) => `${Math.round(applyUnits(v, settings.units))} ${formatUnits(settings.units)}`

  if (withSets.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        Completa series con peso para ver el rango de cargas por sesión.
      </p>
    )
  }

  return (
    <div>
      <ExercisePills
        options={withSets.map((e) => ({ id: e.id, label: e.name }))}
        value={activeId}
        onChange={setExerciseId}
        ariaLabel="Elige ejercicio"
      />
      <CandlestickChart
        data={data}
        ariaLabel={`Rango de cargas por sesión de ${activeExercise?.name ?? ''}`}
        emptyText="No hay series registradas de este ejercicio."
        formatValue={formatValue}
      />
      <p className="mt-1 text-center text-[0.7rem] text-muted">
        Cada vela es una sesión: apertura y cierre (1ª y última serie) con rango máx-mín del peso.
      </p>
    </div>
  )
}
