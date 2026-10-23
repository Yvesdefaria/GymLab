// Gráfico de progreso de cardio: distancia, duración y ritmo por ejercicio a lo largo del tiempo.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Area, XAxis, YAxis } from 'recharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useDataColors } from '@/hooks/useDataColors'
import { axisTick, mobileXAxis, mobileYAxis } from './chartStyle'
import { AnimatedAreaChart } from './AnimatedCharts'
import { ChartTooltip } from './ChartTooltip'
import { calcPace } from '@/domain/cardio'
import type { WorkoutSet, Workout } from '@/domain/types'

interface CardioProgressChartProps {
  sets: WorkoutSet[]
  workouts: Workout[]
  exerciseId: number
  title?: string
}

interface CardioPoint {
  date: string
  distance: number
  duration: number
  pace: number
}

export const CardioProgressChart = ({
  sets,
  workouts,
  exerciseId,
  title,
}: CardioProgressChartProps) => {
  const { t } = useTranslation()
  const colors = useThemeColors()
  const dataColors = useDataColors()

  const workoutsById = useMemo(() => new Map(workouts.map((w) => [w.id, w])), [workouts])

  const data = useMemo(() => {
    const cardioSets = sets.filter(
      (s) => s.exerciseId === exerciseId && s.completed && s.durationSeconds && s.durationSeconds > 0
    )

    // Agrupar por workout (sesión) y sumar duración/distancia.
    const byWorkout = new Map<number, { distance: number; duration: number }>()
    for (const s of cardioSets) {
      const prev = byWorkout.get(s.workoutId) ?? { distance: 0, duration: 0 }
      byWorkout.set(s.workoutId, {
        distance: prev.distance + (s.distanceMeters ?? 0),
        duration: prev.duration + (s.durationSeconds ?? 0),
      })
    }

    const points: CardioPoint[] = []
    for (const [workoutId, agg] of byWorkout) {
      const w = workoutsById.get(workoutId)
      if (!w) continue
      points.push({
        date: w.localDate,
        distance: agg.distance,
        duration: agg.duration,
        pace: agg.distance > 0 ? calcPace(agg.duration, agg.distance) : 0,
      })
    }

    return points.sort((a, b) => a.date.localeCompare(b.date))
  }, [sets, workoutsById, exerciseId])

  if (data.length === 0) return null

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        {title ?? t('stats.cardioProgress')}
      </h4>

      {/* Distancia */}
      <div className="border-t border-border/40 pt-2">
        <p className="mb-1 text-[0.65rem] text-muted">{t('stats.distancia')}</p>
        <div>

            <AnimatedAreaChart data={data} height={160}>
              <defs>
                <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={dataColors.cardio} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={dataColors.cardio} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={axisTick(colors)} {...mobileXAxis} />
              <YAxis tick={axisTick(colors)} {...mobileYAxis} />
              <ChartTooltip
                colors={colors}
                formatter={(v: any) => [`${(Number(v) / 1000).toFixed(2)}km`, t('stats.distancia')]}
                labelFormatter={(l: any) => String(l)}
              />
              <Area
                type="monotone"
                dataKey="distance"
                stroke={dataColors.cardio}
                fill="url(#distGrad)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: dataColors.cardio }}
              />
            </AnimatedAreaChart>

        </div>
      </div>

      {/* Duración */}
      <div className="border-t border-border/40 pt-2">
        <p className="mb-1 text-[0.65rem] text-muted">{t('stats.duracion')}</p>
        <div>

            <AnimatedAreaChart data={data} height={160}>
              <defs>
                <linearGradient id="durGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.gold} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={colors.gold} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={axisTick(colors)} {...mobileXAxis} />
              <YAxis tick={axisTick(colors)} {...mobileYAxis} />
              <ChartTooltip
                colors={colors}
                formatter={(v: any) => [`${Math.round(Number(v) / 60)}min`, t('stats.duracion')]}
                labelFormatter={(l: any) => String(l)}
              />
              <Area
                type="monotone"
                dataKey="duration"
                stroke={colors.gold}
                fill="url(#durGrad)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: colors.gold }}
              />
            </AnimatedAreaChart>

        </div>
      </div>

      {/* Ritmo */}
      {data.some((d) => d.pace > 0) && (
        <div className="border-t border-border/40 pt-2">
          <p className="mb-1 text-[0.65rem] text-muted">{t('stats.ritmo')}</p>
          <div>
  
              <AnimatedAreaChart data={data} height={160}>
                <defs>
                  <linearGradient id="paceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.danger} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={colors.danger} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={axisTick(colors)} {...mobileXAxis} />
                <YAxis tick={axisTick(colors)} {...mobileYAxis} reversed />
                <ChartTooltip
                  colors={colors}
                  formatter={(v: any) => {
                    const num = Number(v)
                    return [`${Math.floor(num)}:${String(Math.round((num % 1) * 60)).padStart(2, '0')} min/km`, t('stats.ritmo')]
                  }}
                  labelFormatter={(l: any) => String(l)}
                />
                <Area
                  type="monotone"
                  dataKey="pace"
                  stroke={colors.danger}
                  fill="url(#paceGrad)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: colors.danger }}
                />
              </AnimatedAreaChart>
  
          </div>
        </div>
      )}
    </div>
  )
}
