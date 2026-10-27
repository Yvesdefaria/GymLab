// Pestaña de fuerza (C1): héroe de nivel/percentil, stats de los 3 levantamientos
// principales y tests + evolución. Conserva el formulario y el repo de benchmarks.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BenchmarkTests } from '@/components/benchmark/BenchmarkTests'
import { BenchmarkEvolutionChart } from '@/components/benchmark/BenchmarkEvolutionChart'
import { StatsHero } from '@/components/stats/StatsHero'
import { StatsStatRow } from '@/components/stats/StatsStatRow'
import { useBenchmarkResults } from '@/hooks/useBenchmarkResults'
import { useBodyProfile } from '@/hooks/useBodyProfile'
import { useSettings } from '@/hooks/useSettings'
import { benchmarkRepo } from '@/data/repositories'
import { getLatest } from '@/domain/benchmark'
import { formatWeight } from '@/domain/settings'
import {
  getStrengthLevel,
  getStrengthPercentile,
  type StrengthLevel,
} from '@/domain/strengthStandards'
import type { BenchmarkResult } from '@/domain/types'

const EXERCISES: BenchmarkResult['exercise'][] = [
  'sentadilla',
  'banca',
  'peso_muerto',
  'press_militar',
]

const bodyWeightOf = (result: BenchmarkResult | undefined): number =>
  result?.bodyWeightKg ?? 80

export const FuerzaTab = () => {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const { bodySex } = useBodyProfile()
  const { results: benchmarkResults } = useBenchmarkResults()

  const latest = useMemo(
    () =>
      EXERCISES.map((exercise) => getLatest(benchmarkResults, exercise)).filter(
        (result): result is BenchmarkResult => result != null,
      ),
    [benchmarkResults],
  )

  const percentiles = useMemo(
    () =>
      bodySex
        ? latest.map((result) =>
            getStrengthPercentile(result.exercise, result.e1rm, bodyWeightOf(result), bodySex),
          )
        : [],
    [latest, bodySex],
  )
  const averagePercentile = percentiles.length
    ? Math.round(percentiles.reduce((sum, value) => sum + value, 0) / percentiles.length)
    : null

  const levels = useMemo(
    () =>
      bodySex
        ? latest.map((result) =>
            getStrengthLevel(result.exercise, result.e1rm, bodyWeightOf(result), bodySex),
          )
        : [],
    [latest, bodySex],
  )
  const modeLevel = useMemo(() => {
    const counts = levels.reduce<Record<string, number>>((acc, level) => {
      acc[level] = (acc[level] ?? 0) + 1
      return acc
    }, {})
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
    return (top ?? null) as StrengthLevel | null
  }, [levels])

  const stat = (exercise: BenchmarkResult['exercise'], color: string) => {
    const result = latest.find((item) => item.exercise === exercise)
    return {
      value: result ? formatWeight(result.e1rm, settings.units) : '—',
      label: t(`benchmark.exercise.${exercise}` as any),
      color,
    }
  }

  const stats = [
    stat('banca', 'bg-data-chest'),
    stat('sentadilla', 'bg-data-legs'),
    stat('peso_muerto', 'bg-data-arms'),
  ]

  return (
    <div className="flex flex-col gap-5">
      <StatsHero
        eyebrow={t('stats.heroNivelFuerza')}
        value={modeLevel ? t(`strength.level.${modeLevel}` as any) : '—'}
        valueClassName="text-[44px]"
        delta={
          averagePercentile != null
            ? t('stats.percentileAvg', {
                pct: averagePercentile,
                count: latest.length,
              })
            : undefined
        }
        deltaTone="progress"
      />
      <StatsStatRow items={stats} />

      <BenchmarkTests
        results={benchmarkResults}
        onAdd={(result) => benchmarkRepo.add(result)}
      />
      {benchmarkResults.length > 0 && (
        <BenchmarkEvolutionChart results={benchmarkResults} />
      )}
    </div>
  )
}
