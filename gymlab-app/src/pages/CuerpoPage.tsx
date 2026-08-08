// Página «Cuerpo» (/cuerpo): mapa muscular (frente/espalda) con fatiga por grupo y detalle.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { MuscleDummy } from '@/components/body/MuscleDummy'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { useWorkouts } from '@/hooks/useWorkouts'
import { useWorkoutSets } from '@/hooks/useWorkoutSets'
import { fatigueLabel, fatigueMap, lastTrainedByMuscle } from '@/domain/muscleFatigue'
import type { MuscleGroup } from '@/domain/types'
import { diffLocalDays, toLocalDateStr } from '@/domain/dates'

// Vista del cuerpo: permite elegir frente/espalda y seleccionar un músculo para ver su detalle.
export const CuerpoPage = () => {
  const [view, setView] = useState<'front' | 'back'>('front')
  const [selected, setSelected] = useState<MuscleGroup | null>(null)

  const { exercises } = useExerciseCatalog()
  const { workouts } = useWorkouts()
  const { sets } = useWorkoutSets()

  // Fatiga derivada de entrenos: último día por músculo y mapa de fatiga para la silueta.
  const lastBy = useMemo(
    () => lastTrainedByMuscle(workouts, sets, exercises),
    [workouts, sets, exercises]
  )
  const fatigue = useMemo(() => fatigueMap(lastBy), [lastBy])

  // Detalle del músculo seleccionado: ejercicios del grupo y días desde el último entreno.
  const groupExercises = selected
    ? exercises.filter((e) => e.muscleGroup === selected)
    : []

  const lastDate = selected ? lastBy[selected] : null
  const daysAgo = lastDate ? diffLocalDays(lastDate, toLocalDateStr()) : null

  return (
    <div>
      <AppHeader title="Cuerpo" subtitle="Grupos musculares y fatiga" />
      <div className="space-y-4 p-4">
        <BackLink to="/mas" />

        <div className="flex gap-2">
          {(['front', 'back'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`min-h-[44px] flex-1 rounded-xl border text-sm font-medium ${
                view === v
                  ? 'border-cta bg-cta/20 text-accent-soft'
                  : 'border-border text-muted'
              }`}
            >
              {v === 'front' ? 'Frente' : 'Espalda'}
            </button>
          ))}
        </div>

        <div className="panel rounded-2xl p-4">
          <MuscleDummy
            fatigue={fatigue}
            view={view}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        {selected ? (
          <section className="panel rounded-2xl p-4">
            <h2 className="font-display text-lg capitalize text-accent">{selected}</h2>
            <p className="mt-1 text-sm text-muted">
              {fatigue[selected]
                ? fatigueLabel[fatigue[selected]!]
                : 'Sin datos'}
              {daysAgo !== null
                ? ` · último entreno hace ${daysAgo === 0 ? 'hoy' : `${daysAgo}d`}`
                : ' · sin entrenos registrados'}
            </p>
            <ul className="mt-3 space-y-2">
              {groupExercises.slice(0, 8).map((ex) => (
                <li key={ex.id}>
                  <Link
                    to={`/ejercicios/${ex.slug}`}
                    className="block rounded-xl border border-border/50 px-3 py-2 text-sm text-fg hover:border-gold/60"
                  >
                    {ex.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="text-center text-sm text-muted">Toca un músculo para ver detalle.</p>
        )}
      </div>
    </div>
  )
}
