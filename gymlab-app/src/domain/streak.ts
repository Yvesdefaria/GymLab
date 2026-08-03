import type { StreakResult } from './types'

const MS_PER_DAY = 86_400_000

const toDateStr = (date: Date): string => date.toISOString().slice(0, 10)

const diffDays = (a: string, b: string): number => {
  const dA = new Date(a)
  const dB = new Date(b)
  return Math.round((dB.getTime() - dA.getTime()) / MS_PER_DAY)
}

export const calcStreak = (workoutDates: string[]): StreakResult => {
  if (workoutDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null }
  }

  const unique = [...new Set(workoutDates.map((d) => d.slice(0, 10)))]
    .sort()
    .reverse()

  const today = toDateStr(new Date())
  const lastDate = unique[0]
  const gapFromToday = diffDays(lastDate, today)

  // Allow streak up to 1 day gap (yesterday or today)
  if (gapFromToday > 1) {
    return { currentStreak: 0, longestStreak: calcLongest(unique), lastWorkoutDate: lastDate }
  }

  let current = 1
  for (let i = 0; i < unique.length - 1; i++) {
    const gap = diffDays(unique[i + 1], unique[i])
    if (gap === 1) {
      current++
    } else {
      break
    }
  }

  return {
    currentStreak: current,
    longestStreak: Math.max(current, calcLongest(unique)),
    lastWorkoutDate: lastDate,
  }
}

const calcLongest = (sortedDates: string[]): number => {
  if (sortedDates.length === 0) return 0

  let longest = 1
  let current = 1

  for (let i = 0; i < sortedDates.length - 1; i++) {
    const gap = diffDays(sortedDates[i + 1], sortedDates[i])
    if (gap === 1) {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }

  return longest
}
