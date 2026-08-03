import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search, ChevronRight } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { useLiveQuery } from 'dexie-react-hooks'
import { exerciseRepo } from '@/data/repositories'
import type { MuscleGroup } from '@/domain/types'

const MUSCLE_GROUPS: MuscleGroup[] = [
  'pecho', 'espalda', 'biceps', 'triceps', 'hombro',
  'pierna', 'gluteo', 'abdomen', 'trapecios', 'antebrazo',
]

const muscleGroupEmoji: Record<MuscleGroup, string> = {
  pecho: '🏋️',
  espalda: '💪',
  biceps: '💪',
  triceps: '💪',
  hombro: '🏋️',
  pierna: '🦵',
  gluteo: '🦵',
  abdomen: '🧱',
  trapecios: '🏋️',
  antebrazo: '💪',
  cardio: '❤️',
}

export const EjerciciosPage = () => {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<MuscleGroup | null>(null)

  const exercises = useLiveQuery(() => exerciseRepo.getAll(), []) ?? []

  const filtered = exercises.filter((ex) => {
    const matchSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = !filter || ex.muscleGroup === filter
    return matchSearch && matchFilter
  })

  return (
    <div>
      <AppHeader
        title="Ejercicios"
        subtitle={`${exercises.length} ejercicios en la biblioteca`}
      />
      <div className="space-y-4 p-4">
        <Link
          to="/mas"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Link>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ejercicio..."
            className="h-11 w-full rounded-xl border border-border bg-bg-elevated pl-9 pr-3 text-sm text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none"
          />
        </div>

        {/* Muscle group filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !filter ? 'bg-cta text-bg' : 'border border-border text-muted hover:border-accent/50'
            }`}
          >
            Todos
          </button>
          {MUSCLE_GROUPS.map((mg) => (
            <button
              key={mg}
              onClick={() => setFilter(filter === mg ? null : mg)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === mg ? 'bg-cta text-bg' : 'border border-border text-muted hover:border-accent/50'
              }`}
            >
              {mg}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <div className="space-y-2">
          {filtered.map((ex) => (
            <Link
              key={ex.id}
              to={`/ejercicios/${ex.slug}`}
              className="flex min-h-[56px] items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 transition-colors hover:border-accent/50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg text-lg">
                {muscleGroupEmoji[ex.muscleGroup]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-fg">{ex.name}</span>
                <span className="block text-xs capitalize text-muted">
                  {ex.muscleGroup} · {ex.equipment}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted" />
            </Link>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-6 text-center">
              <p className="text-sm text-muted">No hay ejercicios con estos filtros.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
