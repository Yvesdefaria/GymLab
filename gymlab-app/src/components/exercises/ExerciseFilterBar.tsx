// Barra de filtros del catálogo de ejercicios (músculo, categoría, equipo, foto, favoritos).
import { useTranslation } from 'react-i18next'
import { Camera, Star } from 'lucide-react'
import { CATEGORY_OPTIONS, EQUIPMENT_OPTIONS, MUSCLE_GROUPS } from '@/domain/catalog'
import { MuscleGroupIcon } from '@/components/exercises/MuscleGroupIcon'
import type { ExerciseCatalogFilters } from '@/hooks/useExerciseCatalog'
import type { AppLanguage } from '@/domain/onboarding'
import { localizeCategory, localizeMuscleGroup, localizeEquipment } from '@/i18n/catalog'
import { HScroll } from '@/components/ui/HScroll'

// Chip de filtro con estado activo reflejado en aria-pressed.
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

// Combina los filtros en filas scrolleables; un toque sobre el chip activo lo limpia.
export const ExerciseFilterBar = ({ filters, onChange }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const toggle = (key: 'muscle' | 'category' | 'equipment', value: string) =>
    onChange({ [key]: filters[key] === value ? null : value } as Partial<ExerciseCatalogFilters>)

  return (
    <div className="space-y-2">
      <HScroll className="pb-1">
        <Chip active={!filters.muscle} onClick={() => onChange({ muscle: null })}>
          {t('ejercicios.filtros.musculo')}
        </Chip>
        {MUSCLE_GROUPS.map((mg) => (
          <Chip key={mg} active={filters.muscle === mg} onClick={() => toggle('muscle', mg)}>
            <MuscleGroupIcon group={mg} className="size-3.5" />
            {localizeMuscleGroup(mg, lang)}
          </Chip>
        ))}
      </HScroll>

      <HScroll className="pb-1">
        <Chip active={!filters.category} onClick={() => onChange({ category: null })}>
          {t('ejercicios.filtros.categoria')}
        </Chip>
        {CATEGORY_OPTIONS.map((cat) => (
          <Chip key={cat} active={filters.category === cat} onClick={() => toggle('category', cat)}>
            {localizeCategory(cat, lang)}
          </Chip>
        ))}
      </HScroll>

      <HScroll className="pb-1">
        <Chip active={!filters.equipment} onClick={() => onChange({ equipment: null })}>
          {t('ejercicios.filtros.equipo')}
        </Chip>
        {EQUIPMENT_OPTIONS.map((eq) => (
          <Chip key={eq} active={filters.equipment === eq} onClick={() => toggle('equipment', eq)}>
            {localizeEquipment(eq, lang)}
          </Chip>
        ))}
      </HScroll>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Chip active={filters.onlyWithPhoto} onClick={() => onChange({ onlyWithPhoto: !filters.onlyWithPhoto })}>
          <span className="inline-flex items-center gap-1">
            <Camera className="size-3.5" aria-hidden />
            {t('ejercicios.filtros.conFoto')}
          </span>
        </Chip>
        <Chip active={filters.onlyFavorites} onClick={() => onChange({ onlyFavorites: !filters.onlyFavorites })}>
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5" aria-hidden />
            {t('ejercicios.filtros.favoritos')}
          </span>
        </Chip>
      </div>
    </div>
  )
}
