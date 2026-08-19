// Periodización: modelo de mesociclos para planificación de entrenamiento.
export type MesocycleType = 'hipertrofia' | 'fuerza' | 'deload' | 'potencia' | 'volumen'

export interface Mesocycle {
  id: string
  name: string
  type: MesocycleType
  weeks: number
  startWeek: number
}

export interface PeriodizationPlan {
  id: string
  name: string
  mesocycles: Mesocycle[]
  totalWeeks: number
  startDate: string
}

// Calcula el total de semanas de un plan.
export const calculateTotalWeeks = (mesocycles: Mesocycle[]): number =>
  mesocycles.reduce((sum, m) => sum + m.weeks, 0)

// Determina la semana actual dentro de un plan.
export const getCurrentWeek = (plan: PeriodizationPlan, currentDate: string): number => {
  const start = new Date(plan.startDate).getTime()
  const now = new Date(currentDate).getTime()
  const weeksElapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24 * 7))
  return Math.max(1, Math.min(weeksElapsed + 1, plan.totalWeeks))
}

// Obtiene el mesociclo actual según la semana.
export const getCurrentMesocycle = (mesocycles: Mesocycle[], currentWeek: number): Mesocycle | null => {
  let accumulated = 0
  for (const m of mesocycles) {
    accumulated += m.weeks
    if (currentWeek <= accumulated) return m
  }
  return mesocycles[mesocycles.length - 1] ?? null
}

// Calcula progreso de cada mesociclo (semana actual / total).
export const getMesocycleProgress = (
  mesocycles: Mesocycle[],
  currentWeek: number,
): { mesocycle: Mesocycle; progress: number }[] => {
  let accumulated = 0
  return mesocycles.map((m) => {
    const start = accumulated + 1
    const end = accumulated + m.weeks
    const progress = currentWeek >= end ? 1 : currentWeek < start ? 0 : (currentWeek - start + 1) / m.weeks
    accumulated = end
    return { mesocycle: m, progress }
  })
}

// Genera un plan de ejemplo.
export const createSamplePlan = (startDate: string): PeriodizationPlan => {
  const mesocycles: Mesocycle[] = [
    { id: 'm1', name: 'Volumen Base', type: 'volumen', weeks: 4, startWeek: 1 },
    { id: 'm2', name: 'Hipertrofia', type: 'hipertrofia', weeks: 4, startWeek: 5 },
    { id: 'm3', name: 'Fuerza', type: 'fuerza', weeks: 3, startWeek: 9 },
    { id: 'm4', name: 'Deload', type: 'deload', weeks: 1, startWeek: 12 },
  ]
  return {
    id: 'plan-1',
    name: 'Plan 12 semanas',
    mesocycles,
    totalWeeks: calculateTotalWeeks(mesocycles),
    startDate,
  }
}
