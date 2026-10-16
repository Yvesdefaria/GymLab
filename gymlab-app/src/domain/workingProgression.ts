// F122 — Progresión por peso de trabajo (capa 2): la prescripción lee series de reps
// (singles/tests de ≤3 reps quedan fuera del carril), detecta margen por doble progresión
// (reps al mismo peso) y decide el próximo escalón; la escalada reparte el salto en las
// series del día. Puro: sin React, sin Dexie.
import { roundToNearestPlate } from './calculators/converter'
import { estimate1RM } from './prs'

// Carril de trabajo: series completadas, de reps (≥4) y con peso.
export const WORKING_MIN_REPS = 4
// Mejora mínima de reps promedio (últimas 2 sesiones vs referencia) para habilitar un paso.
export const REPS_MARGIN = 2
// Paso cuando no hay un peso conocido cercano (+2,5%, una placa).
export const MICRO_STEP_PCT = 2.5
// Un conocido más alto que este % de la base ya no es «un escalón cercano».
export const KNOWN_STEP_MAX_PCT = 15
// Freno de ritmo (T2): velocidad del peso de trabajo por ejercicio.
export const VELOCITY_THRESHOLD_PCT_PER_WEEK = 2.5
export const VELOCITY_WINDOW_DAYS = 21
// Sesiones mínimas en la base antes de habilitar el próximo escalón.
export const MIN_SESSIONS_AT_BASE = 3
// Frescura post-layoff: sin 2 sesiones dentro de esta ventana, no hay propuesta.
export const FRESH_WINDOW_DAYS = 28
const DAY_MS = 86_400_000
// Sesiones que entran en la base (misma heurística que el motor F97/F118).
const RECENT_SESSIONS_N = 5
const DEFAULT_PLATE_KG = 2.5

// Forma mínima de una serie del historial que este módulo consume.
export interface WorkingSetLike {
  workoutId: number
  weightKg: number
  reps: number
  completed: boolean
  isWarmup?: boolean
  createdAt: string
}

export interface StepDecision {
  targetKg: number
  kind: 'known' | 'micro'
  capped: boolean
}

const workSets = (sets: WorkingSetLike[]): WorkingSetLike[] =>
  sets.filter((s) => s.completed && !s.isWarmup && s.weightKg > 0 && s.reps >= WORKING_MIN_REPS)

interface SessionSummary {
  workoutId: number
  createdAt: string
  topKg: number
  avgReps: number
  e1rmKg: number
}

// Resumen por sesión, más reciente primero (workoutId es monótono).
const summarizeSessions = (sets: WorkingSetLike[]): SessionSummary[] => {
  const byWorkout = new Map<number, WorkingSetLike[]>()
  for (const s of workSets(sets)) {
    const group = byWorkout.get(s.workoutId)
    if (group) group.push(s)
    else byWorkout.set(s.workoutId, [s])
  }
  return [...byWorkout.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([workoutId, group]) => ({
      workoutId,
      createdAt: group[0].createdAt,
      topKg: group.reduce((top, s) => Math.max(top, s.weightKg), 0),
      avgReps: group.reduce((sum, s) => sum + s.reps, 0) / group.length,
      e1rmKg: group.reduce((best, s) => Math.max(best, estimate1RM(s.weightKg, s.reps)), 0),
    }))
}

const bucketOf = (weightKg: number, plateKg: number): number =>
  roundToNearestPlate(weightKg, plateKg)

// Base de trabajo: promedio de los tops de las últimas n sesiones (0 sin historial).
export const workingBase = (sets: WorkingSetLike[], n = RECENT_SESSIONS_N): number => {
  if (n <= 0) return 0
  const tops = summarizeSessions(sets)
    .map((s) => s.topKg)
    .filter((t) => t > 0)
    .slice(0, n)
  if (tops.length === 0) return 0
  return tops.reduce((sum, t) => sum + t, 0) / tops.length
}

// Margen por doble progresión: reps al mismo peso (bucket ±placa) con media ≥+2 en las
// últimas 2 sesiones contra la referencia, sostenido por ≥3 sesiones en ese peso. Sin
// peso repetido cae al e1RM al alza (≥2 %); con un peso repetido pero <3 sesiones,
// todavía no hay evidencia sostenida (silencio).
export const hasMargin = (sets: WorkingSetLike[], plateKg = DEFAULT_PLATE_KG): boolean => {
  const sessions = summarizeSessions(sets)
  if (sessions.length === 0) return false

  const recentBucket = bucketOf(sessions[0].topKg, plateKg)
  const bucket = sessions.filter((s) => bucketOf(s.topKg, plateKg) === recentBucket)
  if (bucket.length >= 3) {
    const reference = bucket[bucket.length - 1]
    const recentAvg = (bucket[0].avgReps + bucket[1].avgReps) / 2
    return recentAvg - reference.avgReps >= REPS_MARGIN
  }

  const buckets = sessions.map((s) => bucketOf(s.topKg, plateKg))
  if (new Set(buckets).size !== buckets.length) return false
  if (sessions.length < 2) return false
  const [latest, previous] = sessions
  if (previous.e1rmKg <= 0) return false
  return (latest.e1rmKg - previous.e1rmKg) / previous.e1rmKg >= 0.02
}

// Próximo escalón: el peso conocido más cercano por encima de la base (con ≥2 series
// completadas en alguna sesión, dentro del 15 %), o un micro paso del +2,5 % redondeado
// a placa. El PR es techo de seguridad: si recorta, el objetivo baja a él (`capped`).
export const decideStep = ({
  sets,
  prWeightKg = 0,
  plateKg = DEFAULT_PLATE_KG,
  microStepPct = MICRO_STEP_PCT,
}: {
  sets: WorkingSetLike[]
  prWeightKg?: number
  plateKg?: number
  microStepPct?: number
}): StepDecision | null => {
  const base = workingBase(sets)
  if (base <= 0) return null

  // Buckets de peso con el máximo de series completadas en UNA misma sesión.
  const setsPerSessionByBucket = new Map<number, Map<number, number>>()
  for (const s of workSets(sets)) {
    const bucket = bucketOf(s.weightKg, plateKg)
    const bySession = setsPerSessionByBucket.get(bucket) ?? new Map<number, number>()
    bySession.set(s.workoutId, (bySession.get(s.workoutId) ?? 0) + 1)
    setsPerSessionByBucket.set(bucket, bySession)
  }

  const maxCap = base * (1 + KNOWN_STEP_MAX_PCT / 100)
  let knownTarget = 0
  for (const [bucket, bySession] of setsPerSessionByBucket) {
    if (bucket <= base || bucket > maxCap) continue
    const enoughSets = [...bySession.values()].some((count) => count >= 2)
    if (!enoughSets) continue
    if (knownTarget === 0 || bucket < knownTarget) knownTarget = bucket
  }

  const rawTarget =
    knownTarget > 0
      ? knownTarget
      : roundToNearestPlate(base * (1 + microStepPct / 100), plateKg)
  const kind: StepDecision['kind'] = knownTarget > 0 ? 'known' : 'micro'

  if (prWeightKg > 0 && rawTarget > prWeightKg) {
    return { targetKg: prWeightKg, kind, capped: true }
  }
  return { targetKg: rawTarget, kind, capped: false }
}

// Escalada del día: primera serie en la base, pasos uniformes redondeados a placa y la
// última serie exactamente en el objetivo (aunque el paso intermedio se repita).
export const buildEscalada = (
  baseKg: number,
  targetKg: number,
  setCount: number,
  plateKg = DEFAULT_PLATE_KG
): number[] => {
  if (setCount <= 1) return [targetKg]
  const weights: number[] = []
  for (let i = 0; i < setCount; i++) {
    if (i === setCount - 1) {
      weights.push(targetKg)
      break
    }
    const ideal = baseKg + ((targetKg - baseKg) * i) / (setCount - 1)
    weights.push(roundToNearestPlate(ideal, plateKg))
  }
  return weights
}

// Velocidad del peso de trabajo (%/semana): pendiente simple entre el primer y el último
// top de la ventana; null sin señal (menos de 2 sesiones en la ventana).
export const workingVelocityPctPerWeek = (
  sets: WorkingSetLike[],
  now = new Date()
): number | null => {
  const cutoff = now.getTime() - VELOCITY_WINDOW_DAYS * DAY_MS
  const windowSessions = summarizeSessions(sets).filter(
    (s) => new Date(s.createdAt).getTime() >= cutoff
  )
  if (windowSessions.length < 2) return null
  const latest = windowSessions[0]
  const oldest = windowSessions[windowSessions.length - 1]
  if (oldest.topKg <= 0) return null
  const days =
    Math.abs(new Date(latest.createdAt).getTime() - new Date(oldest.createdAt).getTime()) / DAY_MS
  const weeks = Math.max(days / 7, 1)
  return (((latest.topKg - oldest.topKg) / oldest.topKg) * 100) / weeks
}

// Freno: la subida sostenida por encima del umbral exige consolidar (repetir el peso)
// antes de habilitar el próximo escalón. El umbral es estricto (exactamente 2,5 no frena).
export const shouldConsolidate = (sets: WorkingSetLike[], now = new Date()): boolean => {
  const velocity = workingVelocityPctPerWeek(sets, now)
  return velocity !== null && velocity > VELOCITY_THRESHOLD_PCT_PER_WEEK
}

// Lo que la propuesta del día puede devolver: una escalada aplicable, un aviso de
// consolidación (el freno retiene), o null = silencio (sin evidencia/nada que proponer).
export type DayProposal =
  | { kind: 'escalada'; weightsKg: number[]; capped: boolean }
  | { kind: 'consolidate' }

// Orquestador del día: evidencia + freno + mínimos → escalada, consolidación o silencio.
export const planDayProposal = ({
  sets,
  setCount,
  prWeightKg = 0,
  plateKg = DEFAULT_PLATE_KG,
  microStepPct = MICRO_STEP_PCT,
  now = new Date(),
}: {
  sets: WorkingSetLike[]
  setCount: number
  prWeightKg?: number
  plateKg?: number
  microStepPct?: number
  now?: Date
}): DayProposal | null => {
  const base = workingBase(sets)
  if (base <= 0) return null

  const sessions = summarizeSessions(sets)
  const freshCutoff = now.getTime() - FRESH_WINDOW_DAYS * DAY_MS
  const fresh = sessions.filter((s) => new Date(s.createdAt).getTime() >= freshCutoff)
  if (fresh.length < 2) return null

  if (shouldConsolidate(sets, now)) return { kind: 'consolidate' }
  if (!hasMargin(sets, plateKg)) return null

  const sessionsAtBase = sessions.filter((s) => Math.abs(s.topKg - base) <= plateKg).length
  if (sessionsAtBase < MIN_SESSIONS_AT_BASE) return null

  const step = decideStep({ sets, prWeightKg, plateKg, microStepPct })
  if (!step || step.targetKg <= base) return null

  return {
    kind: 'escalada',
    weightsKg: buildEscalada(base, step.targetKg, Math.max(1, setCount), plateKg),
    capped: step.capped,
  }
}
