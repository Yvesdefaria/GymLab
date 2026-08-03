import { useState } from 'react'
import { Search, Plus, X } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { exerciseRepo } from '@/data/repositories'
import type { Exercise, MuscleGroup } from '@/domain/types'

const MUSCLE_GROUPS: MuscleGroup[] = [
  'pecho', 'espalda', 'biceps', 'triceps', 'hombro',
  'pierna', 'gluteo', 'abdomen', 'trapecios', 'antebrazo',
]

type ExercisePickerProps = {
  onSelect: (exercise: Exercise) => void
  onClose: () => void
}

export const ExercisePicker = ({ onSelect, onClose }: ExercisePickerProps) => {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<MuscleGroup | null>(null)

  const exercises = useLiveQuery(() => exerciseRepo.getAll(), []) ?? []

  const filtered = exercises.filter((ex) => {
    const matchSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = !filter || ex.muscleGroup === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-bg">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ejercicio..."
            className="h-10 w-full rounded-xl border border-border bg-bg-elevated pl-9 pr-3 text-sm text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none"
            autoFocus
          />
        </div>
        <button
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-xl border border-border bg-bg-elevated text-muted hover:text-fg"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-border px-4 py-2">
        <button
          onClick={() => setFilter(null)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !filter ? 'bg-cta text-bg' : 'border border-border text-muted hover:border-accent/50'
          }`}
        >
          Todos
        </button>
        {MUSCLE_GROUPS.map((mg) => (
          <button
            key={mg}
            onClick={() => setFilter(filter === mg ? null : mg)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
              filter === mg ? 'bg-cta text-bg' : 'border border-border text-muted hover:border-accent/50'
            }`}
          >
            {mg}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              className="flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-left transition-colors hover:border-accent/50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg text-accent">
                <Plus className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-fg">{ex.name}</span>
                <span className="block text-xs capitalize text-muted">{ex.muscleGroup} · {ex.equipment}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
