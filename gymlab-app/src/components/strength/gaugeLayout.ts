// Layout puro del gauge de fuerza (F104.2): sin React para poder testearlo.
// Las bandas usan los límites REALES de getStrengthLevel (p50/p75/p90); p25
// solo marca el percentil 25 y no delimita ningún cambio de nivel.
import type { StrengthLevel } from '@/domain/strengthStandards'

export interface GaugeBand {
  level: StrengthLevel
  widthPct: number
}

export interface GaugeLayout {
  markerPct: number
  bands: GaugeBand[]
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

// `thresholds` es [p25, p50, p75, p90]: p25 no delimita bandas porque
// getStrengthLevel asigna "intermedio" recién desde p50.
export const computeGaugeLayout = (
  thresholds: [number, number, number, number],
  e1rm: number,
): GaugeLayout => {
  const [, p50, p75, p90] = thresholds

  // Sin tabla válida no hay escala posible: medida cero en vez de NaN.
  if (p90 <= 0) {
    const levels: StrengthLevel[] = ['principiante', 'intermedio', 'avanzado', 'elite']
    return { markerPct: 0, bands: levels.map((level) => ({ level, widthPct: 0 })) }
  }

  // Misma escala que el gauge anterior: el último nivel se dibuja con un 10% extra.
  const maxVal = p90 * 1.1
  return {
    markerPct: clamp((e1rm / maxVal) * 100, 0, 100),
    bands: [
      { level: 'principiante', widthPct: (p50 / maxVal) * 100 },
      { level: 'intermedio', widthPct: ((p75 - p50) / maxVal) * 100 },
      { level: 'avanzado', widthPct: ((p90 - p75) / maxVal) * 100 },
      { level: 'elite', widthPct: 100 - (p90 / maxVal) * 100 },
    ],
  }
}
