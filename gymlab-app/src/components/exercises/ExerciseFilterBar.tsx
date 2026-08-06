import { Camera, Star } from 'lucide-react'
import { CATEGORY_OPTIONS, EQUIPMENT_OPTIONS, muscleGroupEmoji } from '@/hooks/useExerciseCatalog'
import type { ExerciseCatalogFilters } from '@/hooks/useExerciseCatalog'
import type { MuscleGroup } from '@/domain/types'
import { HScroll } from '@/components/ui/HScroll'

const MUSCLE_GROUPS: MuscleGroup[] = [
  'pecho', 'espalda', 'biceps', 'triceps', 'hombro',
  'pierna', 'gluteo', 'abdomen', 'trapecios', 'antebrazo',
]

const Chip = ({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition-colors ${
      active
        ? 'border-cta bg-cta/20 text-accent-soft'
        : 'border-border text-muted hover:border-cta hover:text-accent-soft'
    }`}
  >
    {children}
  </button>
)

type Props = {
  filters: ExerciseCatalogFilters
  onChange: (patch: Partial<ExerciseCatalogFilters>) => void
}

export const ExerciseFilterBar = ({ filters, onChange }: Props) => {
  const toggle = (key: 'muscle' | 'category' | 'equipment', value: string) =>
    onChange({ [key]: filters[key] === value ? null : value } as Partial<ExerciseCatalogFilters>)

  return (
    <div className="space-y-2">
      <HScroll className="pb-1">
        <Chip active={!filters.muscle} onClick={() => onChange({ muscle: null })}>
          Músculo
        </Chip>
        {MUSCLE_GROUPS.map((mg) => (
          <Chip key={mg} active={filters.muscle === mg} onClick={() => toggle('muscle', mg)}>
            {muscleGroupEmoji[mg]} {mg}
          </Chip>
        ))}
      </HScroll>

      <HScroll className="pb-1">
        <Chip active={!filters.category} onClick={() => onChange({ category: null })}>
          Categoría
        </Chip>
        {CATEGORY_OPTIONS.map((cat) => (
          <Chip key={cat} active={filters.category === cat} onClick={() => toggle('category', cat)}>
            {cat === 'strength' ? 'Fuerza' : cat === 'stretch' ? 'Estiramiento' : cat === 'cardio' ? 'Cardio' : 'Movilidad'}
          </Chip>
        ))}
      </HScroll>

      <HScroll className="pb-1">
        <Chip active={!filters.equipment} onClick={() => onChange({ equipment: null })}>
          Equipo
        </Chip>
        {EQUIPMENT_OPTIONS.map((eq) => (
          <Chip key={eq} active={filters.equipment === eq} onClick={() => toggle('equipment', eq)}>
            {eq}
          </Chip>
        ))}
      </HScroll>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Chip active={filters.onlyWithPhoto} onClick={() => onChange({ onlyWithPhoto: !filters.onlyWithPhoto })}>
          <span className="inline-flex items-center gap-1">
            <Camera className="size-3.5" aria-hidden />
            Con foto
          </span>
        </Chip>
        <Chip active={filters.onlyFavorites} onClick={() => onChange({ onlyFavorites: !filters.onlyFavorites })}>
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5" aria-hidden />
            Favoritos
          </span>
        </Chip>
      </div>
    </div>
  )
}
