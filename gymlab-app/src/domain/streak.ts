import type { StreakResult } from './types'
import { diffLocalDays, toLocalDateStr } from './dates'

const calcLongest = (sortedDesc: string[]): number => {
  if (sortedDesc.length === 0) return 0
  let longest = 1
  let current = 1
  for (let i = 0; i < sortedDesc.length - 1; i++) {
    const gap = diffLocalDays(sortedDesc[i + 1], sortedDesc[i])
    if (gap === 1) {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }
  return longest
}

/** workoutDates: ISO timestamps or local YYYY-MM-DD */
export const calcStreak = (workoutDates: string[]): StreakResult => {
  if (workoutDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null }
  }

  const unique = [
    ...new Set(
      workoutDates.map((d) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(d.slice(0, 10)) && d.length === 10) return d
        return toLocalDateStr(new Date(d))
      })
    ),
  ]
    .sort()
    .reverse()

  const today = toLocalDateStr()
  const lastDate = unique[0]
  const gapFromToday = diffLocalDays(lastDate, today)

  if (gapFromToday > 1) {
    return { currentStreak: 0, longestStreak: calcLongest(unique), lastWorkoutDate: lastDate }
  }

  let current = 1
  for (let i = 0; i < unique.length - 1; i++) {
    const gap = diffLocalDays(unique[i + 1], unique[i])
    if (gap === 1) current++
    else break
  }

  return {
    currentStreak: current,
    longestStreak: Math.max(current, calcLongest(unique)),
    lastWorkoutDate: lastDate,
  }
}
