// Barras comparativas de volumen por grupo muscular (anterior vs posterior) con el valor
// visible. Sin radar: barras con etiqueta textual para no depender del color (a11y).
import { useTranslation } from 'react-i18next'
import { applyUnits, formatUnits } from '@/domain/settings'
import { formatVolume } from '@/domain/volume'
import { localizeMuscleGroup } from '@/i18n/catalog'
import type { Units } from '@/domain/settings'
import type { AppLanguage } from '@/domain/onboarding'
import type { MuscleGroup } from '@/domain/types'

interface GroupVolume {
  group: MuscleGroup
  volume: number
}

interface MergedGroup {
  group: MuscleGroup
  older: number
  newer: number
}

// Une los grupos de ambas sesiones; un grupo ausente en un lado vale 0.
const mergeGroups = (older: GroupVolume[], newer: GroupVolume[]): MergedGroup[] => {
  const byGroup = new Map<MuscleGroup, MergedGroup>()
  const entry = (group: MuscleGroup): MergedGroup => {
    const existing = byGroup.get(group)
    if (existing) return existing
    const created = { group, older: 0, newer: 0 }
    byGroup.set(group, created)
    return created
  }
  for (const item of older) entry(item.group).older = item.volume
  for (const item of newer) entry(item.group).newer = item.volume
  return [...byGroup.values()].sort((a, b) => Math.max(b.older, b.newer) - Math.max(a.older, a.newer))
}

const BarRow = ({
  label,
  value,
  max,
  barClass,
  unitLabel,
  units,
}: {
  label: string
  value: number
  max: number
  barClass: string
  unitLabel: string
  units: Units
}) => (
  <div className="flex items-center gap-2">
    <span className="w-16 shrink-0 text-xs text-muted">{label}</span>
    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-bg" aria-hidden>
      <div
        className={`h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none ${barClass}`}
        style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
      />
    </div>
    {/* El ancho es una razón, así que usa el valor crudo en kg; el texto sí se convierte a la unidad elegida. */}
    <span className="w-20 shrink-0 text-right text-xs tabular-nums text-fg">
      {formatVolume(applyUnits(value, units))} {unitLabel}
    </span>
  </div>
)

interface MuscleGroupBarsProps {
  older: GroupVolume[]
  newer: GroupVolume[]
  units: Units
}

export const MuscleGroupBars = ({ older, newer, units }: MuscleGroupBarsProps) => {
  const { t, i18n } = useTranslation()
  const rows = mergeGroups(older, newer)
  if (rows.length === 0) return null

  const lang = i18n.language as AppLanguage
  const unitLabel = formatUnits(units)
  const max = Math.max(1, ...rows.flatMap((row) => [row.older, row.newer]))

  return (
    <section data-testid="compare-muscle-groups" className="pt-1">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">{t('compare.muscleGroups')}</h3>
      <ul className="space-y-2.5">
        {rows.map((row) => (
          <li key={row.group} data-testid={`compare-muscle-${row.group}`}>
            <p className="mb-1 text-xs font-medium text-fg">{localizeMuscleGroup(row.group, lang)}</p>
            <div className="space-y-1">
              <BarRow label={t('compare.older')} value={row.older} max={max} barClass="bg-muted/50" unitLabel={unitLabel} units={units} />
              <BarRow label={t('compare.newer')} value={row.newer} max={max} barClass="bg-accent" unitLabel={unitLabel} units={units} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
