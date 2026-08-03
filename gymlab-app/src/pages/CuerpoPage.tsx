import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppHeader } from '@/components/layout/AppHeader'
import { MuscleDummy } from '@/components/body/MuscleDummy'
import { exerciseRepo, workoutRepo, workoutSetRepo } from '@/data/repositories'
import { fatigueLabel, fatigueMap, lastTrainedByMuscle } from '@/domain/muscleFatigue'
import type { MuscleGroup } from '@/domain/types'
import { diffLocalDays, toLocalDateStr } from '@/domain/dates'

export const CuerpoPage = () => {
  const [view, setView] = useState<'front' | 'back'>('front')
  const [selected, setSelected] = useState<MuscleGroup | null>(null)

  const exercises = useLiveQuery(() => exerciseRepo.getAll(), []) ?? []
  const workouts = useLiveQuery(() => workoutRepo.getAll(), []) ?? []
  const sets = useLiveQuery(() => workoutSetRepo.getAll(), []) ?? []

  const lastBy = useMemo(
    () => lastTrainedByMuscle(workouts, sets, exercises),
    [workouts, sets, exercises]
  )
  const fatigue = useMemo(() => fatigueMap(lastBy), [lastBy])

  const groupExercises = selected
    ? exercises.filter((e) => e.muscleGroup === selected)
    : []

  const lastDate = selected ? lastBy[selected] : null
  const daysAgo = lastDate ? diffLocalDays(lastDate, toLocalDateStr()) : null

  return (
    <div>
      <AppHeader title="Cuerpo" subtitle="Grupos musculares y fatiga" />
      <div className="space-y-4 p-4">
        <Link to="/mas" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft">
          <ArrowLeft className="size-4" /> Más
        </Link>

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

        <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
          <MuscleDummy
            fatigue={fatigue}
            view={view}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        {selected ? (
          <section className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
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
