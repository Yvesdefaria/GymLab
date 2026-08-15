// Área con puntos de la evolución de cargas por sesión de un ejercicio — reemplaza las velas OHLC.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatedAreaChart } from './AnimatedCharts'
import { XAxis, YAxis, Tooltip, CartesianGrid, Area } from 'recharts'
import { ExercisePills } from './ExercisePills'
import { buildLoadRangeSeries } from '@/domain/trainingStats'
import { useSettings } from '@/hooks/useSettings'
import { useThemeColors } from '@/hooks/useThemeColors'
import { axisTick, tooltipStyle } from './chartStyle'
import { applyUnits, formatUnits } from '@/domain/settings'
import { formatDayShort } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { Exercise, Workout, WorkoutSet } from '@/domain/types'

type Props = {
  sets: WorkoutSet[]
  workoutsById: ReadonlyMap<number, Workout>
  exercises: Exercise[]
}

export const LoadRangeCandlestick = ({ sets, workoutsById, exercises }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const { settings } = useSettings()

  const withSets = useMemo(() => {
    const ids = new Set(sets.map((s) => s.exerciseId))
    return exercises.filter((e) => ids.has(e.id))
  }, [sets, exercises])

  const [exerciseId, setExerciseId] = useState<number | null>(null)
  const activeId = exerciseId ?? withSets[0]?.id ?? null
  const activeExercise = withSets.find((e) => e.id === activeId)

  // Peso máximo por sesión del ejercicio elegido — la evolución del top set marca la progresión.
  const data = useMemo(() => {
    if (activeId == null) return []
    return buildLoadRangeSeries(sets, workoutsById, activeId).map((p) => ({
      date: formatDayShort(p.date, lang),
      peso: Math.round(applyUnits(p.high, settings.units) * 10) / 10,
      open: Math.round(applyUnits(p.open, settings.units) * 10) / 10,
      close: Math.round(applyUnits(p.close, settings.units) * 10) / 10,
      low: Math.round(applyUnits(p.low, settings.units) * 10) / 10,
    }))
  }, [sets, workoutsById, activeId, settings.units, lang])

  const formatValue = (v: number) => `${v} ${formatUnits(settings.units)}`

  if (withSets.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        {t('stats.cargasSinDatos')}
      </p>
    )
  }

  return (
    <div>
      <ExercisePills
        options={withSets.map((e) => ({ id: e.id, label: e.name }))}
        value={activeId}
        onChange={setExerciseId}
        ariaLabel={t('stats.elegirEjercicio')}
      />
      <div role="img" aria-label={t('stats.cargasAria', { ejercicio: activeExercise?.name ?? '' })}>
        <AnimatedAreaChart data={data} height={240} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.gold} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colors.gold} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={axisTick(colors)}
            axisLine={false}
            tickLine={false}
            minTickGap={12}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={axisTick(colors)}
            axisLine={false}
            tickLine={false}
            width={38}
            tickFormatter={(v) => String(v)}
          />
          <Tooltip
            contentStyle={tooltipStyle(colors)}
            labelStyle={{ color: colors.muted }}
            itemStyle={{ color: colors.fg }}
            formatter={(_value, _name, item) => {
              const p = (item as { payload?: { open?: number; close?: number; low?: number } }).payload
              if (!p) return [formatValue(Number(_value)), t('stats.cargaMax')]
              return [
                t('stats.cargaDetalle', {
                  max: formatValue(Number(_value)),
                  primera: p.open,
                  ultima: p.close,
                  minima: p.low,
                }),
                t('stats.cargas'),
              ]
            }}
          />
          <Area
            type="monotone"
            dataKey="peso"
            stroke={colors.gold}
            strokeWidth={2.5}
            fill="url(#loadGradient)"
            dot={{ r: 4, fill: colors.gold, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: colors.cta, strokeWidth: 0 }}
          />
        </AnimatedAreaChart>
      </div>
      <p className="mt-1 text-center text-[0.7rem] text-muted">
        {t('stats.cargasPie')}
      </p>
    </div>
  )
}
