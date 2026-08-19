// Estándares de fuerza: gauge visual con percentil y nivel por ejercicio.
import { useTranslation } from 'react-i18next'
import { BarChart3 } from 'lucide-react'
import { getStrengthLevel, getStrengthPercentile, getStrengthThresholds, type StrengthLevel } from '@/domain/strengthStandards'
import type { BenchmarkExercise } from '@/domain/benchmark'

const levelColor: Record<StrengthLevel, string> = {
  principiante: 'bg-blue-400',
  intermedio: 'bg-accent',
  avanzado: 'bg-orange-400',
  elite: 'bg-red-400',
}

interface StrengthGaugeProps {
  exercise: BenchmarkExercise
  e1rm: number
  bodyWeight: number
}

export const StrengthGauge = ({ exercise, e1rm, bodyWeight }: StrengthGaugeProps) => {
  const { t } = useTranslation()
  const level = getStrengthLevel(exercise, e1rm, bodyWeight)
  const percentile = getStrengthPercentile(exercise, e1rm, bodyWeight)
  const [principiante, intermedio, avanzado, elite] = getStrengthThresholds(exercise, bodyWeight)

  // Posición del gauge (0-100%).
  const maxVal = elite * 1.1
  const pct = Math.min(100, (e1rm / maxVal) * 100)

  return (
    <div className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-3.5 text-accent" aria-hidden />
        <p className="text-[0.65rem] font-semibold text-fg">
          {exercise === 'sentadilla' ? t('benchmark.exercise.sentadilla') : exercise === 'banca' ? t('benchmark.exercise.banca') : exercise === 'peso_muerto' ? t('benchmark.exercise.peso_muerto') : t('benchmark.exercise.press_militar')}
        </p>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[0.5rem] font-bold text-bg ${levelColor[level]}`}>
          {level === 'principiante' ? t('strength.level.principiante') : level === 'intermedio' ? t('strength.level.intermedio') : level === 'avanzado' ? t('strength.level.avanzado') : t('strength.level.elite')}
        </span>
      </div>

      {/* Gauge bar */}
      <div className="mt-2 h-2 w-full rounded-full bg-border/30 overflow-hidden relative">
        {/* Segmentos de nivel */}
        <div className="absolute inset-0 flex">
          <div className="h-full bg-blue-400/20" style={{ width: `${(principiante / maxVal) * 100}%` }} />
          <div className="h-full bg-accent/20" style={{ width: `${((intermedio - principiante) / maxVal) * 100}%` }} />
          <div className="h-full bg-orange-400/20" style={{ width: `${((avanzado - intermedio) / maxVal) * 100}%` }} />
          <div className="h-full bg-red-400/20" style={{ width: `${((elite - avanzado) / maxVal) * 100}%` }} />
        </div>
        {/* Indicador de posición */}
        <div
          className="absolute top-0 h-full w-1 rounded-full bg-fg shadow-sm transition-all duration-500"
          style={{ left: `${pct}%` }}
        />
      </div>

      {/* Marcas */}
      <div className="mt-1 flex justify-between text-[0.45rem] text-muted">
        <span>{t('strength.beginner')}</span>
        <span>{t('strength.intermediate')}</span>
        <span>{t('strength.advanced')}</span>
        <span>{t('strength.elite')}</span>
      </div>

      {/* Valor */}
      <p className="mt-1 text-center text-[0.6rem] text-muted">
        {e1rm.toFixed(1)}kg · {t('strength.percentile')}: {percentile.toFixed(0)}%
      </p>
    </div>
  )
}
