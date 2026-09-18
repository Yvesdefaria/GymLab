// Retos dinámicos adaptativos: generan desafíos según historial y nivel del usuario.
// El progreso se calcula según la duración del reto y se resetea automáticamente al terminar el periodo.
import type { Level, Workout, WorkoutSet } from './types'
import { weekStartKey, twoWeekStartKey, monthStartKey, toLocalDateStr } from './dates'

export type ChallengeType = 'frecuencia' | 'volumen' | 'pr' | 'consistencia'
export type ChallengeDuration = '1semana' | '2semanas' | '1mes' | '2meses'
export type ChallengeTab = 'active' | 'available'

// Tab inicial de la sección de retos: si no hay ninguno activo pero sí disponibles,
// abrir en «Disponibles» — si no, la sección se ve vacía teniendo retos para hacer.
export const defaultChallengeTab = (activeCount: number, availableCount: number): ChallengeTab =>
  activeCount === 0 && availableCount > 0 ? 'available' : 'active'

export interface Challenge {
  id: string
  titleKey: string
  descriptionKey: string
  type: ChallengeType
  duration: ChallengeDuration
  target: number
  unitKey: string
  minLevel: Level
}

export interface ChallengeProgress {
  challengeId: string
  current: number
  target: number
  completed: boolean
}

export interface ChallengeStats {
  sessionsCount: number
  setsCount: number
  prsCount: number
  consecutiveWeeks: number
}

// Deriva nivel del usuario a partir de su historial.
export const deriveLevel = (workouts: Workout[]): Level => {
  const count = workouts.length
  if (count >= 150) return 'avanzado'
  if (count >= 40) return 'intermedio'
  return 'principiante'
}

const workoutLocalDate = (w: Workout): string =>
  w.localDate.length === 10 ? w.localDate : toLocalDateStr(new Date(w.localDate))

// Inicio del periodo de 2 meses: primer día del mes dos meses atrás.
// Se extrae para no repetir el cálculo en cada conteo.
const twoMonthsStartKey = (now: string): string => {
  const d = new Date(now + 'T12:00:00')
  d.setMonth(d.getMonth() - 2)
  d.setDate(1)
  return toLocalDateStr(d)
}

// Única fuente de verdad de «¿esta fecha cae en el periodo de esta duración?».
// La comparten workouts, PRs y series para que los conteos no diverjan.
const isInPeriod = (date: string, duration: ChallengeDuration, now = toLocalDateStr()): boolean => {
  switch (duration) {
    case '1semana': return weekStartKey(date) === weekStartKey(now)
    case '2semanas': return date >= twoWeekStartKey(now)
    case '1mes': return date >= monthStartKey(now)
    case '2meses': return date >= twoMonthsStartKey(now)
  }
}

// Filtra workouts dentro del periodo que corresponde a la duración del reto.
const workoutsInPeriod = (
  workouts: Workout[],
  duration: ChallengeDuration,
  now: string,
): Workout[] =>
  workouts.filter((w) => isInPeriod(workoutLocalDate(w), duration, now))

// Calcula stats de retos para cada periodo de duración.
// PRs y series se filtran por periodo con la misma regla `isInPeriod`.
export const computeChallengeStats = (
  workouts: Workout[],
  allPrDates: string[],
  sets: WorkoutSet[],
  now = toLocalDateStr(),
): { '1semana': ChallengeStats; '2semanas': ChallengeStats; '1mes': ChallengeStats; '2meses': ChallengeStats } => {
  const allDates = new Set(workouts.map((w) => workoutLocalDate(w)))
  const msPerDay = 86_400_000

  // ¿La semana que contiene `ms` tiene al menos una sesión registrada?
  const weekHasSession = (ms: number): boolean => {
    const wKey = weekStartKey(toLocalDateStr(new Date(ms)))
    return [...allDates].some((d) => weekStartKey(d) === wKey)
  }

  // Semanas consecutivas con al menos 1 sesión, terminando en la semana más
  // reciente que tenga una. Si la semana en curso todavía no tiene sesión, se
  // saltea y se arranca desde la anterior: la semana actual está a medias y no
  // debe romper la racha (un hueco real sí la corta).
  // Ancla a MEDIODÍA local, no a medianoche UTC: `new Date('YYYY-MM-DD')` se parsea
  // como UTC y en zonas con offset negativo (p. ej. UTC-3) caería en el día local
  // anterior, corriendo la semana. Es la misma convención que `dates.ts`.
  let consecutiveWeeks = 0
  let cursorMs = new Date(now + 'T12:00:00').getTime()
  if (!weekHasSession(cursorMs)) cursorMs -= 7 * msPerDay
  while (weekHasSession(cursorMs)) {
    consecutiveWeeks++
    cursorMs -= 7 * msPerDay
  }

  // Fecha de cada workout para ubicar sus series en el periodo.
  const workoutDateById = new Map(workouts.map((w) => [w.id, workoutLocalDate(w)]))

  // Cuenta PRs dentro del periodo de duración dado.
  const prsInPeriod = (duration: ChallengeDuration): number =>
    allPrDates.filter((d) => isInPeriod(d, duration, now)).length

  // Cuenta series de TRABAJO completadas del periodo. Diverge a propósito de
  // computeSessionStats (que sí incluye calentamientos): el resumen de sesión
  // mide todo lo completado, pero el reto mide series de trabajo. Si contara
  // calentamientos, el número quedaría inflado y se alcanzaría «20 series» sin
  // hacer 20 series reales.
  const setsInPeriod = (duration: ChallengeDuration): number =>
    sets.filter((s) => {
      if (!s.completed || s.isWarmup) return false
      const date = workoutDateById.get(s.workoutId)
      // Serie huérfana (sin workout en la lista): se ignora en vez de contarla sin fecha.
      return date !== undefined && isInPeriod(date, duration, now)
    }).length

  const build = (duration: ChallengeDuration): ChallengeStats => ({
    sessionsCount: workoutsInPeriod(workouts, duration, now).length,
    setsCount: setsInPeriod(duration),
    prsCount: prsInPeriod(duration),
    consecutiveWeeks,
  })

  return {
    '1semana': build('1semana'),
    '2semanas': build('2semanas'),
    '1mes': build('1mes'),
    '2meses': build('2meses'),
  }
}

// Seed de retos predefinidos.
export const CHALLENGES: Challenge[] = [
  // Frecuencia
  { id: 'freq-3', titleKey: 'challenge.freq3.title', descriptionKey: 'challenge.freq3.desc', type: 'frecuencia', duration: '1semana', target: 3, unitKey: 'challenge.unit.sessions', minLevel: 'principiante' },
  { id: 'freq-5', titleKey: 'challenge.freq5.title', descriptionKey: 'challenge.freq5.desc', type: 'frecuencia', duration: '1semana', target: 5, unitKey: 'challenge.unit.sessions', minLevel: 'intermedio' },
  { id: 'freq-6', titleKey: 'challenge.freq6.title', descriptionKey: 'challenge.freq6.desc', type: 'frecuencia', duration: '1semana', target: 6, unitKey: 'challenge.unit.sessions', minLevel: 'avanzado' },

  // Volumen (series completadas; el título y la descripción ya hablan de series)
  { id: 'vol-20', titleKey: 'challenge.vol20.title', descriptionKey: 'challenge.vol20.desc', type: 'volumen', duration: '1semana', target: 20, unitKey: 'challenge.unit.sets', minLevel: 'principiante' },
  { id: 'vol-40', titleKey: 'challenge.vol40.title', descriptionKey: 'challenge.vol40.desc', type: 'volumen', duration: '2semanas', target: 40, unitKey: 'challenge.unit.sets', minLevel: 'intermedio' },
  { id: 'vol-80', titleKey: 'challenge.vol80.title', descriptionKey: 'challenge.vol80.desc', type: 'volumen', duration: '1mes', target: 80, unitKey: 'challenge.unit.sets', minLevel: 'avanzado' },

  // PRs
  { id: 'pr-1', titleKey: 'challenge.pr1.title', descriptionKey: 'challenge.pr1.desc', type: 'pr', duration: '1semana', target: 1, unitKey: 'challenge.unit.pr', minLevel: 'principiante' },
  { id: 'pr-3', titleKey: 'challenge.pr3.title', descriptionKey: 'challenge.pr3.desc', type: 'pr', duration: '2semanas', target: 3, unitKey: 'challenge.unit.prs', minLevel: 'intermedio' },

  // Consistencia
  { id: 'cons-4', titleKey: 'challenge.cons4.title', descriptionKey: 'challenge.cons4.desc', type: 'consistencia', duration: '1mes', target: 4, unitKey: 'challenge.unit.consecutiveWeeks', minLevel: 'principiante' },
  { id: 'cons-8', titleKey: 'challenge.cons8.title', descriptionKey: 'challenge.cons8.desc', type: 'consistencia', duration: '2meses', target: 8, unitKey: 'challenge.unit.consecutiveWeeks', minLevel: 'intermedio' },
]

// Filtra retos disponibles según nivel.
export const getAvailableChallenges = (level: Level): Challenge[] => {
  const levels: Level[] = ['principiante', 'intermedio', 'avanzado']
  const minIdx = levels.indexOf(level)
  return CHALLENGES.filter((c) => levels.indexOf(c.minLevel) <= minIdx)
}

// Calcula progreso de un reto.
export const calculateProgress = (challenge: Challenge, current: number): ChallengeProgress => ({
  challengeId: challenge.id,
  current: Math.min(current, challenge.target),
  target: challenge.target,
  completed: current >= challenge.target,
})

const currentForChallenge = (challenge: Challenge, stats: ChallengeStats): number => {
  switch (challenge.type) {
    case 'frecuencia': return stats.sessionsCount
    case 'volumen': return stats.setsCount
    case 'pr': return stats.prsCount
    case 'consistencia': return stats.consecutiveWeeks
  }
}

const dateKey = (date: string): string =>
  date.length === 10 ? date : toLocalDateStr(new Date(date))

// Cuántos retos del catálogo se completaron en ALGÚN periodo histórico.
// Sirve al logro de /logros: el progreso del periodo actual se resetea, el
// desbloqueo no debe depender de que la semana en curso siga llena.
export const countEverCompletedChallenges = (
  workouts: Workout[],
  allPrDates: string[],
  sets: WorkoutSet[],
): number => {
  const dates = [...new Set([
    ...workouts.map(workoutLocalDate),
    ...allPrDates.map(dateKey),
  ])]
  if (dates.length === 0) return 0
  const done = new Set<string>()
  for (const now of dates) {
    const byDuration = computeChallengeStats(workouts, allPrDates, sets, now)
    for (const challenge of CHALLENGES) {
      if (done.has(challenge.id)) continue
      if (currentForChallenge(challenge, byDuration[challenge.duration]) >= challenge.target) {
        done.add(challenge.id)
      }
    }
    if (done.size === CHALLENGES.length) break
  }
  return done.size
}

// Reto diario «Camina 10k» (F84e): se completa al alcanzar la meta del día.
// La meta la resuelve el llamador (por defecto 10.000); aquí solo se forma el
// progreso con clamp al target, igual que calculateProgress.
export const STEP_CHALLENGE_ID = 'pasos-10k'

export const getDailyStepChallenge = (stepsToday: number, goal: number): ChallengeProgress => ({
  challengeId: STEP_CHALLENGE_ID,
  current: Math.min(stepsToday, goal),
  target: goal,
  completed: stepsToday >= goal,
})
