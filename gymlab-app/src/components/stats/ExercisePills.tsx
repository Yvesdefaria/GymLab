export interface ExercisePillOption {
  id: number
  label: string
}

type Props = {
  options: ExercisePillOption[]
  value: number | null
  onChange: (id: number) => void
  ariaLabel: string
}

export const ExercisePills = ({ options, value, onChange, ariaLabel }: Props) => {
  return (
    <div className="mb-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
      <div className="flex w-max gap-2" role="group" aria-label={ariaLabel}>
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              value === o.id
                ? 'border-cta bg-cta/20 text-accent-soft'
                : 'border-border text-muted hover:border-cta'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
