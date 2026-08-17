// Cálculo del score de recuperación (0-100) basado en días sin entrenar, sueño, dolor y racha.

export type RecoveryRating = 'ready' | 'maybe' | 'rest'

export interface RecoveryScoreInput {
  daysSinceLastWorkout: number | null
  sleep: number | null
  soreness: number | null
  currentStreak: number
}

export interface RecoveryScoreResult {
  score: number
  classification: RecoveryRating
  breakdown: {
    daysSince: number
    sleep: number
    soreness: number
    streak: number
  }
}

// Pesos de cada factor (suman 1.0)
const W_DAYS = 0.40
const W_SLEEP = 0.25
const W_SORENESS = 0.20
const W_STREAK = 0.15

// Puntuación por días sin entrenar: 0 días = 100, 7+ días = 0 (lineal).
const daysScore = (days: number): number =>
  Math.max(0, 100 - (days / 7) * 100)

// Puntuación por sueño (1-5): 1 = 0, 5 = 100.
const sleepScore = (sleep: number): number =>
  ((sleep - 1) / 4) * 100

// Puntuación por dolor (1-5): 1 = mucho dolor = 0, 5 = sin dolor = 100.
const sorenessScore = (soreness: number): number =>
  ((soreness - 1) / 4) * 100

// Puntuación por racha: 0 días = 0, 7+ días = 100 (lineal).
const streakScore = (streak: number): number =>
  Math.min(100, (streak / 7) * 100)

export const computeRecoveryScore = (input: RecoveryScoreInput): RecoveryScoreResult => {
  const hasDays = input.daysSinceLastWorkout !== null
  const hasSleep = input.sleep !== null
  const hasSoreness = input.soreness !== null

  // Sin datos de días ni journal: score 0
  if (!hasDays && !hasSleep && !hasSoreness) {
    return { score: 0, classification: 'rest', breakdown: { daysSince: 0, sleep: 0, soreness: 0, streak: 0 } }
  }

  const dScore = hasDays ? daysScore(input.daysSinceLastWorkout!) : 0
  const sScore = hasSleep ? sleepScore(input.sleep!) : 0
  const pScore = hasSoreness ? sorenessScore(input.soreness!) : 0
  const rScore = streakScore(input.currentStreak)

  // Redistribuir pesos de los factores disponibles
  const totalWeight =
    (hasDays ? W_DAYS : 0) +
    (hasSleep ? W_SLEEP : 0) +
    (hasSoreness ? W_SORENESS : 0) +
    W_STREAK

  const score = Math.round(
    (dScore * (hasDays ? W_DAYS : 0) +
      sScore * (hasSleep ? W_SLEEP : 0) +
      pScore * (hasSoreness ? W_SORENESS : 0) +
      rScore * W_STREAK) /
      totalWeight
  )

  const classification: RecoveryRating =
    score >= 70 ? 'ready' : score >= 40 ? 'maybe' : 'rest'

  return {
    score,
    classification,
    breakdown: {
      daysSince: Math.round(dScore),
      sleep: Math.round(sScore),
      soreness: Math.round(pScore),
      streak: Math.round(rScore),
    },
  }
}
