// Tabla de métricas de la comparativa: tres bloques (Carga, Intensidad, Alcance) con el
// valor de cada sesión y un chip de delta. Usa semántica de tabla real (th/scope) para
// que un lector de pantalla asocie cada métrica con sus dos valores.
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { applyUnits, formatUnits, formatWeight } from '@/domain/settings'
import { formatVolume } from '@/domain/volume'
import type { Units } from '@/domain/settings'
import type { SessionComparisonResult } from '@/domain/sessionComparison'

type Tone = 'positive' | 'neutral' | 'alert'
type ValueKind = 'volume' | 'weight' | 'count'
// Solo las métricas "subir es mejor": calorías tiene delta nullable y chip propio.
type DeltaKey = Exclude<keyof SessionComparisonResult['deltas'], 'calories'>
type TFn = TFunction<'translation', undefined>

// Misma paleta de chips que TrendBadge (components/stats/TrendBadge.tsx). Se replica
// porque su auto-tono no puede expresar "neutro aunque suba" (duración) ni forzar
// el tono en las métricas donde subir es mejor.
const toneStyles: Record<Tone, string> = {
  positive: 'border-success/30 bg-success/10 text-success',
  neutral: 'border-border/30 bg-bg-elevated/50 text-muted',
  alert: 'border-danger/30 bg-danger/10 text-danger',
}

interface MetricRow {
  key: string
  label: string
  olderText: string
  newerText: string
  chip: { text: string; tone: Tone } | null
}

interface MetricBlock {
  label: string
  rows: MetricRow[]
}

// Signo explícito para no depender solo del color (a11y).
const signed = (value: number): string => (value > 0 ? '+' : value < 0 ? '−' : '')

const caloriesText = (kcal: number | null): string => (kcal === null ? '—' : `${kcal} kcal`)

// Calorías estimadas (MET × duración × peso): subir no es intrínsecamente mejor,
// así que el chip es neutro (como duración) y desaparece si falta un lado.
const caloriesChip = ({ delta, pct }: { delta: number | null; pct: number | null }): MetricRow['chip'] => {
  if (delta === null) return null
  const text =
    pct !== null
      ? `${signed(delta)}${Math.round(Math.abs(pct))}%`
      : `${signed(delta)}${Math.abs(delta)} kcal`
  return { text, tone: 'neutral' }
}

const DeltaChip = ({ text, tone }: { text: string; tone: Tone }) => {
  const Icon = tone === 'positive' ? TrendingUp : tone === 'alert' ? TrendingDown : Minus
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${toneStyles[tone]}`}>
      <Icon className="size-3" aria-hidden />
      {text}
    </span>
  )
}

const buildBlocks = (result: SessionComparisonResult, units: Units, t: TFn): MetricBlock[] => {
  const { older, newer, deltas, newExercises } = result
  const unitLabel = formatUnits(units)
  const fmt = (value: number, kind: ValueKind): string => {
    if (kind === 'volume') return `${formatVolume(applyUnits(value, units))} ${unitLabel}`
    if (kind === 'weight') return formatWeight(value, units)
    return String(value)
  }
  const durationText = (min: number | null): string =>
    min === null ? '—' : t('stats.minSufijo', { min })

  // Métricas donde subir es intrínsecamente mejor: el tono lo marca el signo del delta.
  const upGood = (key: DeltaKey, label: string, kind: ValueKind, olderValue: number, newerValue: number): MetricRow => {
    const { delta, pct } = deltas[key]
    const abs = Math.abs(delta)
    // pct null (base anterior 0): cae al delta absoluto formateado con k/M.
    const chipText =
      pct !== null
        ? `${signed(delta)}${Math.round(Math.abs(pct))}%`
        : `${signed(delta)}${fmt(abs, kind)}`
    return {
      key,
      label,
      olderText: fmt(olderValue, kind),
      newerText: fmt(newerValue, kind),
      chip: { text: chipText, tone: delta > 0 ? 'positive' : delta < 0 ? 'alert' : 'neutral' },
    }
  }

  return [
    {
      label: t('compare.blockLoad'),
      rows: [
        upGood('volume', t('compare.volume'), 'volume', older.metrics.volume, newer.metrics.volume),
        upGood('sets', t('compare.sets'), 'count', older.metrics.sets, newer.metrics.sets),
        upGood('reps', t('compare.reps'), 'count', older.metrics.reps, newer.metrics.reps),
        upGood('avgWeightPerSet', t('compare.avgWeight'), 'weight', older.metrics.avgWeightPerSet, newer.metrics.avgWeightPerSet),
      ],
    },
    {
      label: t('compare.blockIntensity'),
      rows: [
        upGood('intensity', t('compare.intensity'), 'weight', older.metrics.intensity, newer.metrics.intensity),
        upGood('avgE1rm', t('compare.avgE1rm'), 'weight', older.metrics.avgE1rm, newer.metrics.avgE1rm),
      ],
    },
    {
      label: t('compare.blockScope'),
      rows: [
        upGood('exercises', t('compare.exercises'), 'count', older.metrics.exercises, newer.metrics.exercises),
        // «Ejercicios nuevos» no tiene par anterior/posterior ni delta: es un conteo propio.
        { key: 'newExercises', label: t('compare.newExercises'), olderText: '—', newerText: String(newExercises), chip: null },
        upGood('prs', t('compare.prs'), 'count', older.metrics.prs, newer.metrics.prs),
        // Duración: subir no es mejor (tono neutro, sin chip).
        {
          key: 'duration',
          label: t('compare.duration'),
          olderText: durationText(older.metrics.durationMin),
          newerText: durationText(newer.metrics.durationMin),
          chip: null,
        },
        // Calorías estimadas por MET × duración × peso: también neutras y con «—» sin datos.
        {
          key: 'calories',
          label: t('compare.calories'),
          olderText: caloriesText(older.metrics.calories),
          newerText: caloriesText(newer.metrics.calories),
          chip: caloriesChip(deltas.calories),
        },
      ],
    },
  ]
}

interface ComparisonMetricTableProps {
  result: SessionComparisonResult
  olderLabel: string
  newerLabel: string
  units: Units
}

export const ComparisonMetricTable = ({ result, olderLabel, newerLabel, units }: ComparisonMetricTableProps) => {
  const { t } = useTranslation()
  const blocks = buildBlocks(result, units, t)
  const cellClass = 'py-1.5 text-xs tabular-nums'

  return (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr className="border-b border-border/40">
          <th scope="col" className="w-[38%] py-1.5 pr-2 text-left text-xs font-medium text-muted">
            {t('compare.metric')}
          </th>
          <th scope="col" data-testid="compare-header-older" className="w-[31%] px-1 py-1.5 text-right text-xs font-medium text-muted">
            {olderLabel}
          </th>
          <th scope="col" data-testid="compare-header-newer" className="w-[31%] pl-1 py-1.5 text-right text-xs font-medium text-muted">
            {newerLabel}
          </th>
        </tr>
      </thead>
      {blocks.map((block) => (
        <tbody key={block.label}>
          <tr>
            <th scope="colgroup" colSpan={3} className="pt-3 pb-1 text-left text-xs font-semibold uppercase tracking-wider text-accent">
              {block.label}
            </th>
          </tr>
          {block.rows.map((row) => (
            <tr key={row.key} className="border-b border-border/20 last:border-0">
              <th scope="row" className={`${cellClass} pr-2 text-left font-normal text-muted`}>
                {row.label}
              </th>
              <td data-testid={`compare-older-${row.key}`} className={`${cellClass} px-1 text-right align-top text-fg`}>
                {row.olderText}
              </td>
              <td data-testid={`compare-newer-${row.key}`} className={`${cellClass} pl-1 text-right align-top text-fg`}>
                <span className="flex flex-col items-end gap-1">
                  <span>{row.newerText}</span>
                  {row.chip ? <DeltaChip text={row.chip.text} tone={row.chip.tone} /> : null}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  )
}
