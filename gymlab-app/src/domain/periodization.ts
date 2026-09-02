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

// Genera un plan vacío para que el usuario construya desde cero.
export const createEmptyPlan = (startDate: string): PeriodizationPlan => ({
  id: `plan-${Date.now()}`,
  name: 'Mi plan',
  mesocycles: [],
  totalWeeks: 0,
  startDate,
})
