// Primitivas de Ajustes en Nocturno Minimal (§10.6 «grupos hairline»):
// eyebrow de 10 px, filas de 44 px, hairline superior y cero tarjetas.
// Los controles (switch, select, número) pierden el borde de caja para que la
// fila sea la unidad visual; el área táctil sigue en 44 px.
import { ChevronDown } from 'lucide-react'
import type { Palette } from '@/hooks/useTheme'
import type { I18nKey } from '@/i18n'
import type { HelpId } from '@/i18n/help'
import { DecimalInput } from '@/components/ui/DecimalInput'
import { InfoTip } from '@/components/ui/InfoTip'

export const settingsGroupClass = 'border-t border-border/40 pb-1 pt-3'
export const settingsRowClass =
  'flex min-h-11 items-center justify-between gap-3 py-1.5 text-sm text-fg'

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-[10px] font-semibold uppercase leading-5 tracking-[0.2em] text-muted">
    {children}
  </h2>
)

export const Toggle = ({
  checked,
  onChange,
  label,
  description,
  help,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
  help?: HelpId
}) => (
  <div className={settingsRowClass}>
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <p className="text-sm text-fg">{label}</p>
        {help && <InfoTip id={help} />}
      </div>
      {description && (
        <p className="mt-0.5 text-xs leading-snug text-muted">{description}</p>
      )}
    </div>
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex h-11 w-12 shrink-0 items-center justify-center"
    >
      <span
        className={`relative h-7 w-12 rounded-full transition-colors motion-reduce:transition-none ${
          checked ? 'bg-cta' : 'bg-border'
        }`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full transition-all motion-reduce:transition-none ${
            checked ? 'left-6 bg-bg' : 'left-1 bg-muted'
          }`}
        />
      </span>
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
  mode = 'decimal',
}: {
  value: number
  onChange: (v: number) => void
  label: string
  suffix?: string
  min?: number
  max?: number
  mode?: 'decimal' | 'integer'
}) => (
  <div className="flex shrink-0 items-center gap-1">
    <DecimalInput
      value={value}
      onChange={(v) => {
        // Vacío/texto inválido no reescribe un 0; solo confirma decimales válidos.
        if (v !== undefined) onChange(v)
      }}
      min={min}
      max={max}
      mode={mode}
      inputMode={mode === 'integer' ? 'numeric' : 'decimal'}
      zeroAsEmpty={false}
      placeholder="0"
      ariaLabel={label}
      className="h-11 w-16 border-0 border-b border-border/50 bg-transparent px-1 text-right text-sm tabular-nums text-fg focus:border-cta focus:outline-none"
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
  <div className="relative shrink-0">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="h-11 max-w-[11.5rem] appearance-none truncate bg-transparent pl-2 pr-7 text-right text-sm text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <ChevronDown
      className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-muted"
      aria-hidden
    />
  </div>
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
