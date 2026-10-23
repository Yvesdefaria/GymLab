// Estándares de fuerza: gauge compacto de bandas + marcador. En C1 no repite
// tarjeta, nombre ni valores: eso ya vive en la fila de BenchmarkTests.
import { useTranslation } from 'react-i18next'
import { getStrengthThresholds, type StrengthLevel } from '@/domain/strengthStandards'
import { computeGaugeLayout } from './gaugeLayout'
import type { BenchmarkExercise } from '@/domain/benchmark'

// Bandas translúcidas por nivel con la paleta categórica; el verde no participa.
const bandColor: Record<StrengthLevel, string> = {
  principiante: 'bg-data-cardio/20',
  intermedio: 'bg-gold/20',
  avanzado: 'bg-data-arms/20',
  elite: 'bg-gold-bright/20',
}

const bandLabelKey = {
  principiante: 'strength.beginner',
  intermedio: 'strength.intermediate',
  avanzado: 'strength.advanced',
  elite: 'strength.elite',
} as const satisfies Record<StrengthLevel, string>

interface StrengthGaugeProps {
  exercise: BenchmarkExercise
  e1rm: number
  bodyWeight: number
}

export const StrengthGauge = ({ exercise, e1rm, bodyWeight }: StrengthGaugeProps) => {
  const { t } = useTranslation()
  // Bandas y marcador comparten los umbrales reales de nivel (p50/p75/p90).
  const { markerPct, bands } = computeGaugeLayout(
    getStrengthThresholds(exercise, bodyWeight),
    e1rm,
  )

  return (
    <div className="mt-2" data-gauge>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-border/30" data-gauge-bar>
        <div className="absolute inset-0 flex">
          {bands.map((band) => (
            <div
              key={band.level}
              data-gauge-band
              className={`h-full ${bandColor[band.level]}`}
              style={{ width: `${band.widthPct}%` }}
            />
          ))}
        </div>
        <div
          data-gauge-marker
          className="absolute top-0 h-full w-1 rounded-full bg-fg shadow-sm transition-all duration-500"
          style={{ left: `${markerPct}%` }}
        />
      </div>

      <div className="mt-1 flex text-[0.45rem] text-muted">
        {bands.map((band) => (
          <span
            key={band.level}
            data-gauge-label
            className="whitespace-nowrap text-center"
            style={{ width: `${band.widthPct}%` }}
          >
            {t(bandLabelKey[band.level])}
          </span>
        ))}
      </div>
    </div>
  )
}
