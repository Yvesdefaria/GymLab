/// <reference types="node" />
// F103/T8 — invariantes de compartición de derivaciones en el home. El entorno de
// vitest es node (sin jsdom), así que estos casos auditan los módulos FUENTE (mismo
// patrón que notificationsWiring.test.ts): fijan que visitar `/` no derive la racha
// tres veces (página + weeklySummary + recovery), que los widgets compartan el
// agrupamiento de series y que el selector de día no repita lecturas (F99/F103).
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = fileURLToPath(new URL('../../../src', import.meta.url))

// Quita comentarios para auditar CÓDIGO (la prosa nombra los cálculos y daría falsos positivos).
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const readSource = (relative: string) =>
  stripComments(readFileSync(path.join(SRC, relative), 'utf8'))

const countOf = (source: string, pattern: RegExp): number =>
  source.match(pattern)?.length ?? 0

describe('home: derivaciones compartidas (F103/T8)', () => {
  const entrenar = readSource('pages/EntrenarPage.tsx')
  const recovery = readSource('hooks/useRecoveryScore.ts')
  const weekly = readSource('domain/weeklySummary.ts')

  it('la racha se calcula UNA vez en la página y se pasa a recovery y weeklySummary', () => {
    // Antes: EntrenarPage + useRecoveryScore + buildWeeklySummary = 3 cálculos.
    const total = countOf(entrenar, /calcStreak\(/g) +
      countOf(recovery, /calcStreak\(/g) +
      countOf(weekly, /calcStreak\(/g)
    expect(total).toBe(1)

    expect(entrenar).toMatch(/buildWeeklySummary\(workouts, prs, streak/)
    expect(entrenar).toMatch(/useRecoveryScore\(workouts, journals, streak\.currentStreak\)/)
  })

  it('el agrupamiento de series se calcula una vez y baja a plateau y proyecciones', () => {
    // Antes: detectPlateaus + buildGoalProjections = 2 groupSetsByExercise(sets).
    expect(countOf(entrenar, /groupSetsByExercise\(sets\)/g)).toBe(1)
    expect(entrenar).toMatch(/<PlateauAlerts[\s\S]*?setsByExercise=/)
    expect(entrenar).toMatch(/<GoalProjectionCard[\s\S]*?setsByExercise=/)
  })

  it('el set de días entrenados se reutiliza en el dashboard (sin reconstruirlo)', () => {
    expect(entrenar).toMatch(/<ProgressDashboard[\s\S]*?trained=\{trainedDates\}/)
  })

  it('el selector de día es la única fuente de días/items de la rutina', () => {
    // Antes: useRoutineDays (getDays ×2) + useRoutineDaysWithItems + useRoutineDay
    // (getItems+enrich del día de hoy ×2).
    expect(entrenar).not.toMatch(/useRoutineDays\(/)
    expect(entrenar).not.toMatch(/useRoutineDay\(/)
    expect(countOf(entrenar, /useRoutineDaysWithItems\(/g)).toBe(1)
  })

  it('useRecoveryScore recibe la racha resuelta y no declara consultas propias', () => {
    expect(recovery).not.toMatch(/workoutRepo|calcStreak\(/)
    expect(recovery).toMatch(/currentStreak/)
  })

  it('useRoutineDaysWithItems lee los items en un solo lote (Promise.all)', () => {
    const routines = readSource('hooks/useRoutines.ts')
    const selector = routines.slice(routines.indexOf('export const useRoutineDaysWithItems'))
    // Antes: for-of con un `await getItems` por día (N roundtrips secuenciales).
    expect(selector).not.toMatch(/await routineRepo\.getItems\(/)
    expect(selector).toMatch(/Promise\.all\(days\.map\(\(day\) => routineRepo\.getItems\(day\.id\)\)\)/)
  })
})
