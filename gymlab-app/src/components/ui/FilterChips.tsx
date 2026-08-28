// Píldoras de filtro reutilizables: chip individual y grupo de selección exclusiva (con deselección).
// Unifica el patrón de chips (filtros de rutinas, toggle sexo) que antes se copiaba en cada página.
type FilterChipProps = {
  label: string
  selected: boolean
  onClick: () => void
  grow?: boolean
}

export const FilterChip = ({ label, selected, onClick, grow = false }: FilterChipProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex min-h-[44px] items-center rounded-full px-3 text-xs font-medium transition-colors ${
        grow ? 'flex-1' : ''
      } ${
        selected
          ? 'border border-cta bg-cta/20 text-accent-soft'
          : 'border border-border text-muted hover:border-cta hover:text-accent-soft'
      }`}
    >
      {label}
    </button>
  )
}

type FilterChipsProps<T extends string> = {
  options: ReadonlyArray<{ value: T; label: string }>
  value: T | null
  onChange: (value: T | null) => void
  ariaLabel: string
  /** false = siempre debe haber una opción seleccionada (toggle sin deselección). */
  allowDeselect?: boolean
  grow?: boolean
  className?: string
}

export const FilterChips = <T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  allowDeselect = true,
  grow = false,
  className = '',
}: FilterChipsProps<T>) => {
  return (
    <div role="group" aria-label={ariaLabel} className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <FilterChip
            key={opt.value}
            label={opt.label}
            selected={selected}
            grow={grow}
            onClick={() => onChange(selected && allowDeselect ? null : opt.value)}
          />
        )
      })}
    </div>
  )
}