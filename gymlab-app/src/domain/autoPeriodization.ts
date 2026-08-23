// Auto-periodización: genera planes inteligentes basados en datos de entrenamiento del usuario.
import type { Workout, WorkoutSet, Exercise } from './types'
import type { PeriodizationPlan, Mesocycle, MesocycleType } from './periodization'
import { calculateTotalWeeks } from './periodization'
import { weeklyFrequency, buildWeeklyVolumeSeries } from './trainingStats'
import { detectPlateaus } from './plateauDetector'

export interface AutoPlanInput {
  workouts: Workout[]
  sets: WorkoutSet[]
  exercises: Exercise[]
  startDate: string
  weeksLabel?: string
}

interface WeekSignal {
  week: string
  frequency: number
  volume: number
}

// Analiza señales de las últimas N semanas.
const analyzeRecentWeeks = (
  workouts: Workout[],
  _sets: WorkoutSet[],
  weeks: number
): WeekSignal[] => {
  const freq = weeklyFrequency(workouts)
  const vol = buildWeeklyVolumeSeries(workouts)
  const volMap = new Map(vol.map((v) => [v.week, v.volume]))
  return freq.slice(-weeks).map((f) => ({
    week: f.week,
    frequency: f.count,
    volume: volMap.get(f.week) ?? 0,
  }))
}

// Detecta tendencia de volumen: 'rising', 'falling', 'stable'.
const volumeTrend = (signals: WeekSignal[]): 'rising' | 'falling' | 'stable' => {
  if (signals.length < 2) return 'stable'
  const recent = signals.slice(-3)
  const avgRecent = recent.reduce((s, x) => s + x.volume, 0) / recent.length
  const older = signals.slice(0, Math.max(1, signals.length - 3))
  const avgOlder = older.reduce((s, x) => s + x.volume, 0) / older.length
  if (avgOlder === 0) return 'stable'
  const pctChange = (avgRecent - avgOlder) / avgOlder
  if (pctChange > 0.05) return 'rising'
  if (pctChange < -0.10) return 'falling'
  return 'stable'
}

// Detecta si la frecuencia ha sido alta y sostenida (>3.5 sesiones/semana, 4+ semanas).
const sustainedHighFrequency = (signals: WeekSignal[]): boolean => {
  const last4 = signals.slice(-4)
  return last4.length >= 4 && last4.every((s) => s.frequency >= 3.5)
}

// Nombre descriptivo para un mesociclo según contexto.
const mesocycleName = (type: MesocycleType, index: number, _total: number): string => {
  const prefixes: Record<MesocycleType, string[]> = {
    volumen: ['Volumen Base', 'Acumulación', 'Construcción'],
    hipertrofia: ['Hipertrofia', 'Crecimiento', 'Desarrollo'],
    fuerza: ['Fuerza', 'Intensificación', 'Peak'],
    deload: ['Deload', 'Recuperación', 'Descarga'],
    potencia: ['Potencia', 'Explosividad', 'Rendimiento'],
  }
  const options = prefixes[type]
  return options[index % options.length]
}

// Genera un plan de periodización basado en datos del usuario.
export const generateSmartPlan = (input: AutoPlanInput): PeriodizationPlan => {
  const { workouts, sets, exercises, startDate, weeksLabel = 'weeks' } = input
  const signals = analyzeRecentWeeks(workouts, sets, 12)
  const plateaus = detectPlateaus(sets, exercises)
  const vTrend = volumeTrend(signals)
  const highFreq = sustainedHighFrequency(signals)

  const mesocycles: Mesocycle[] = []
  let weekCounter = 1

  const addMeso = (type: MesocycleType, weeks: number) => {
    mesocycles.push({
      id: `m${mesocycles.length + 1}`,
      name: mesocycleName(type, mesocycles.length, 4),
      type,
      weeks,
      startWeek: weekCounter,
    })
    weekCounter += weeks
  }

  // Si hay datos, generar plan adaptado. Si no, plan estándar.
  if (signals.length < 2) {
    // Sin suficientes datos: plan estándar 12 semanas.
    addMeso('volumen', 4)
    addMeso('hipertrofia', 4)
    addMeso('fuerza', 3)
    addMeso('deload', 1)
  } else {
    const hasPlateaus = plateaus.length > 0
    const longestPlateau = hasPlateaus ? Math.max(...plateaus.map((p) => p.weeksStagnant)) : 0

    if (hasPlateaus && longestPlateau >= 6) {
      // Estancamiento severo: deload corto + cambio de enfoque.
      addMeso('deload', 1)
      addMeso('potencia', 3)
      addMeso('volumen', 4)
      addMeso('hipertrofia', 3)
      addMeso('deload', 1)
    } else if (hasPlateaus && longestPlateau >= 4) {
      // Estancamiento moderado: deload + fuerza.
      addMeso('deload', 1)
      addMeso('fuerza', 4)
      addMeso('volumen', 4)
      addMeso('deload', 1)
    } else if (highFreq && vTrend === 'rising') {
      // Alta frecuencia + volumen creciente: necesita deload pronto.
      addMeso('volumen', 3)
      addMeso('deload', 1)
      addMeso('hipertrofia', 4)
      addMeso('fuerza', 3)
      addMeso('deload', 1)
    } else if (vTrend === 'falling') {
      // Volumen cayendo: reconstruir base.
      addMeso('volumen', 4)
      addMeso('hipertrofia', 4)
      addMeso('fuerza', 3)
      addMeso('deload', 1)
    } else {
      // Plan equilibrado estándar.
      addMeso('volumen', 4)
      addMeso('hipertrofia', 4)
      addMeso('fuerza', 3)
      addMeso('deload', 1)
    }
  }

  return {
    id: `plan-${Date.now()}`,
    name: `Plan ${calculateTotalWeeks(mesocycles)} ${weeksLabel}`,
    mesocycles,
    totalWeeks: calculateTotalWeeks(mesocycles),
    startDate,
  }
}
