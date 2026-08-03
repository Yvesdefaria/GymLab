import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Dumbbell } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { ExerciseMedia } from '@/components/exercise/ExerciseMedia'
import { useLiveQuery } from 'dexie-react-hooks'
import { exerciseRepo } from '@/data/repositories'
import { useExerciseRecents } from '@/hooks/useExerciseFavorites'

const muscleGroupLabels: Record<string, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  hombro: 'Hombro',
  pierna: 'Pierna',
  gluteo: 'Glúteo',
  abdomen: 'Abdomen',
  trapecios: 'Trapecios',
  antebrazo: 'Antebrazo',
}

export const EjercicioDetailPage = () => {
  const { slug } = useParams()
  const { record } = useExerciseRecents()

  const exercise = useLiveQuery(
    () => (slug ? exerciseRepo.getBySlug(slug) : undefined),
    [slug]
  )

  useEffect(() => {
    if (exercise) void record(exercise.id)
  }, [exercise, record])

  if (!exercise) {
    return (
      <div>
        <AppHeader title="Ejercicio" />
        <div className="p-4">
          <Link to="/ejercicios" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft">
            <ArrowLeft className="size-4" /> Volver
          </Link>
          <div className="mt-4 rounded-2xl border border-gold/40 bg-bg-elevated p-5 text-center">
            <p className="text-sm text-muted">Ejercicio no encontrado.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHeader
        title={exercise.name}
        subtitle={`${muscleGroupLabels[exercise.muscleGroup] ?? exercise.muscleGroup} · ${exercise.equipment}`}
      />
      <div className="space-y-4 p-4">
        <Link
          to="/ejercicios"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft"
        >
          <ArrowLeft className="size-4" />
          Todos los ejercicios
        </Link>

        <ExerciseMedia name={exercise.name} imageUrls={exercise.imageUrls} />

        <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
          <div className="mb-3 flex items-center gap-2">
            <Dumbbell className="size-5 text-accent" />
            <span className="font-display text-sm font-semibold text-accent">Técnica</span>
          </div>
          <p className="text-sm leading-relaxed text-fg">{exercise.instructions}</p>
        </div>

        <div className="flex gap-2">
          <span className="rounded-full bg-bg px-3 py-1 text-xs font-medium capitalize text-muted">
            {exercise.muscleGroup}
          </span>
          <span className="rounded-full bg-bg px-3 py-1 text-xs font-medium capitalize text-muted">
            {exercise.equipment}
          </span>
        </div>
      </div>
    </div>
  )
}
