import { clamp } from '@/domain/numberGuard'
import type { Palette } from '@/hooks/useTheme'
import type { I18nKey } from '@/i18n'

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
    {children}
  </h2>
)

export const Toggle = ({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) => (
  <div className="flex items-center justify-between gap-3 py-3">
    <div className="min-w-0">
      <p className="text-sm font-medium text-fg">{label}</p>
      {description && (
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      )}
    </div>
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-11 w-14 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-cta' : 'bg-border'
      }`}
    >
      <span
        className={`absolute left-1 top-1/2 size-6 -translate-y-1/2 rounded-full bg-bg shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
)

export const NumberField = ({
  value,
  onChange,
  label,
  suffix,
  min,
  max,
}: {
  value: number
  onChange: (v: number) => void
  label: string
  suffix?: string
  min?: number
  max?: number
}) => (
  <div className="flex items-center gap-2">
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) =>
        onChange(
          clamp(
            Number(e.target.value),
            min ?? 0,
            max ?? Number.MAX_SAFE_INTEGER,
          ),
        )
      }
      aria-label={label}
      className="h-11 w-20 rounded-lg border border-border bg-bg px-2 text-center text-sm text-fg focus:border-cta focus:outline-none"
    />
    {suffix && <span className="text-xs text-muted">{suffix}</span>}
  </div>
)

export const Select = ({
  value,
  onChange,
  label,
  options,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  options: { value: string; label: string }[]
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    aria-label={label}
    className="h-11 rounded-lg border border-border bg-bg px-2 text-sm text-fg focus:border-cta focus:outline-none"
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
)

export const PALETTE_LABELS: Record<Palette, I18nKey> = {
  gold: 'ajustes.paletaDorado',
  energy: 'ajustes.paletaEnergia',
  crimson: 'ajustes.paletaCarmesi',
  electric: 'ajustes.paletaElectrico',
  violet: 'ajustes.paletaVioleta',
  gray: 'ajustes.paletaGris',
}

export const PALETTE_SWATCH: Record<Palette, string> = {
  gold: 'swatch-gold',
  energy: 'swatch-energy',
  crimson: 'swatch-crimson',
  electric: 'swatch-electric',
  violet: 'swatch-violet',
  gray: 'swatch-gray',
}
