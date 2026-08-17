// Insights derivados del journal de sesión: correlación sueño/energía vs rendimiento.
import type { SessionJournalEntry, Workout } from './types'

export interface JournalInsight {
  key: 'buenSueno' | 'malSueno' | 'altaEnergia' | 'bajaEnergia'
  params?: { pct?: number }
}

// Compara el volumen medio de sesiones con buen sueño (≥4) vs mal sueño (≤2).
// Requiere al menos 3 journal entries para generar un insight.
export const computeJournalInsight = (
  journals: SessionJournalEntry[],
  workouts: Workout[],
): JournalInsight | null => {
  if (journals.length < 3) return null

  const workoutMap = new Map(workouts.map((w) => [w.id, w]))

  // Separa sesiones por calidad de sueño.
  const goodSleep: number[] = []
  const badSleep: number[] = []
  const highEnergy: number[] = []
  const lowEnergy: number[] = []

  for (const j of journals) {
    const w = workoutMap.get(j.workoutId)
    if (!w || w.totalVolume <= 0) continue

    if (j.sleep >= 4) goodSleep.push(w.totalVolume)
    if (j.sleep <= 2) badSleep.push(w.totalVolume)
    if (j.energy >= 4) highEnergy.push(w.totalVolume)
    if (j.energy <= 2) lowEnergy.push(w.totalVolume)
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

  // Insight de sueño: comparar buen sueño vs mal sueño.
  if (goodSleep.length >= 2 && badSleep.length >= 2) {
    const avgGood = avg(goodSleep)
    const avgBad = avg(badSleep)
    if (avgBad > 0) {
      const pct = Math.round(((avgGood - avgBad) / avgBad) * 100)
      if (pct >= 10) return { key: 'buenSueno', params: { pct } }
      if (pct <= -10) return { key: 'malSueno' }
    }
  }

  // Insight de energía: sesiones con alta energía vs baja.
  if (highEnergy.length >= 2 && lowEnergy.length >= 2) {
    const avgHigh = avg(highEnergy)
    const avgLow = avg(lowEnergy)
    if (avgLow > 0) {
      const pct = Math.round(((avgHigh - avgLow) / avgLow) * 100)
      if (pct >= 10) return { key: 'altaEnergia', params: { pct } }
      if (pct <= -10) return { key: 'bajaEnergia' }
    }
  }

  return null
}
