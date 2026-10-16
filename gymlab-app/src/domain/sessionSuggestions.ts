// Sugerencias inteligentes en sesión: analiza series completadas y sugiere ajustes.
import type { LoadTarget } from './loadRecommendation'

export type SuggestionType = 'increase' | 'decrease' | 'rest' | 'switch' | 'warning' | 'warmup'

// Acción ejecutable que acompaña a la sugerencia (botón de un toque). El peso viaja
// ABSOLUTO —el objetivo del motor (F118/G5)—: la acción no calcula su propio peso ni
// aplica deltas sobre series vacías.
export type SuggestionAction =
  | { kind: 'applyWeight'; targetKg: number }
  | { kind: 'addWarmupSet'; warmupWeightKg: number }

export interface SessionSuggestion {
  id: string
  type: SuggestionType
  exerciseId: number
  messageKey: string
  priority: 'high' | 'medium' | 'low'
  data?: Record<string, string | number>
  action?: SuggestionAction
  // F118: el objetivo del motor quedó recortado por el PR (techo). La UI lo usa para
  // mostrar el aviso del récord también junto al chip.
  capped?: boolean
}

export interface CompletedSet {
  exerciseId: number
  weightKg: number
  reps: number
  rpe?: number
  rir?: number
  setNumber: number
}

// Serie activa (completada o pendiente) para decidir el calentamiento.
export interface ActiveSetInput {
  exerciseId: number
  weightKg: number
  isWarmup?: boolean
  completed: boolean
  setNumber: number
}

export interface SuggestionOptions {
  // e1RM conocido por ejercicio (del historial de PRs).
  knownE1RM?: Record<number, number>
  // Series tal como están en la sesión activa (para ver warmups y pesos pendientes).
  activeSets?: ActiveSetInput[]
  // Minutos de descanso recomendados por ejercicio, derivados de `calcRestRecommendation`
  // (F97.1/D1). Si falta la recomendación de un ejercicio, no se emite aviso de descanso:
  // nunca se inventa una duración fija.
  restMinutesByExercise?: Record<number, number>
  // Carga objetivo por ejercicio, calculada por el motor único `recommendLoad` (F97.2/97.4).
  // El overlay NO inventa un peso: solo sugiere subir cuando el motor da un objetivo superior.
  // F118: incluye si el PR recortó el objetivo (`capped`).
  loadTargetByExercise?: Record<number, LoadTarget>
}

// Serie completada en la forma que consume el motor de sugerencias (agregada desde el store).
export interface SuggestionSetInput {
  exerciseId: number
  weightKg: number
  reps: number
  rpe?: number
  rir?: number
  setNumber: number
  completed: boolean
}

// Umbral de carga: si el primer set de trabajo pesa >= 70% del e1RM, se sugiere calentar.
export const WARMUP_E1RM_THRESHOLD = 0.7
// Peso sugerido para el set de calentamiento (~45% de la carga de trabajo).
export const WARMUP_WEIGHT_RATIO = 0.45

const roundToHalf = (kg: number): number => Math.round(kg * 2) / 2

// Convierte los ejercicios de la sesión activa en la entrada del motor: solo series
// completadas de TRABAJO con peso (F118/G4: los calentamientos quedan fuera — rompían
// la igualdad first/last, los promedios y los umbrales de conteo).
export const completedSetsForSuggestions = (
  exercises: {
    exerciseId: number
    sets: {
      weightKg: number
      reps: number
      rpe?: number
      rir?: number
      setNumber: number
      completed: boolean
      isWarmup?: boolean
    }[]
  }[]
): SuggestionSetInput[] =>
  exercises.flatMap((ex) =>
    ex.sets
      .filter((s) => s.completed && !s.isWarmup && s.weightKg > 0)
      .map((s) => ({
        exerciseId: ex.exerciseId,
        weightKg: s.weightKg,
        reps: s.reps,
        rpe: s.rpe,
        rir: s.rir,
        setNumber: s.setNumber,
        completed: true,
      }))
  )

// Busca la serie de trabajo con la que arrancaría el ejercicio (primera no-warmup con peso).
const firstWorkingSet = (activeSets: ActiveSetInput[] | undefined, exerciseId: number) =>
  activeSets
    ?.filter((s) => s.exerciseId === exerciseId && !s.isWarmup && s.weightKg > 0 && !s.completed)
    .sort((a, b) => a.setNumber - b.setNumber)[0]

// ¿El ejercicio ya incluye series de calentamiento?
const hasWarmup = (activeSets: ActiveSetInput[] | undefined, exerciseId: number) =>
  activeSets?.some((s) => s.exerciseId === exerciseId && s.isWarmup)

// Promedio de valores REALES; undefined si no hay ninguno. F118: el esfuerzo ausente no
// se inventa (antes `rpe ?? 7` / `rir ?? 2`) — solo los datos cargados deciden.
const averageOf = (values: number[]): number | undefined =>
  values.length > 0 ? values.reduce((acc, v) => acc + v, 0) / values.length : undefined

const numbersOnly = (values: (number | undefined)[]): number[] =>
  values.filter((v): v is number => v !== undefined)

// Analiza series completadas y genera sugerencias.
export const generateSuggestions = (
  completedSets: CompletedSet[],
  options: SuggestionOptions = {}
): SessionSuggestion[] => {
  const suggestions: SessionSuggestion[] = []
  const exerciseGroups = new Map<number, CompletedSet[]>()

  // Agrupar por ejercicio.
  for (const set of completedSets) {
    const group = exerciseGroups.get(set.exerciseId) ?? []
    group.push(set)
    exerciseGroups.set(set.exerciseId, group)
  }

  for (const [exerciseId, sets] of exerciseGroups) {
    // Calentamiento: peso inicial alto (>=70% del e1RM) y sin warmup previo.
    const e1rm = options.knownE1RM?.[exerciseId]
    const working = firstWorkingSet(options.activeSets, exerciseId)
    if (e1rm && working && !hasWarmup(options.activeSets, exerciseId)) {
      const pct = Math.round((working.weightKg / e1rm) * 100)
      if (working.weightKg >= e1rm * WARMUP_E1RM_THRESHOLD) {
        suggestions.push({
          id: `warmup-${exerciseId}`,
          type: 'warmup',
          exerciseId,
          messageKey: 'suggestions.warmupHighWeight',
          priority: 'medium',
          data: { pct, weight: working.weightKg },
          action: { kind: 'addWarmupSet', warmupWeightKg: roundToHalf(working.weightKg * WARMUP_WEIGHT_RATIO) },
        })
      }
    }

    // F118: promedios solo con series que tienen dato real; sin datos quedan en undefined.
    const avgRpe = averageOf(numbersOnly(sets.map((s) => s.rpe)))
    const avgRir = averageOf(numbersOnly(sets.map((s) => s.rir)))
    // Top de trabajo de la sesión: la misma base que usa el motor para el objetivo.
    const topWorking = sets.reduce((top, s) => Math.max(top, s.weightKg), 0)

    // Sugerencia: subir peso (F118). La señal la lleva el MOTOR: objetivo > top de la
    // sesión. El esfuerzo real solo suprime (al límite) o confirma el nudge; nunca es la
    // puerta — con RPE/RIR apagados la sugerencia sigue siendo alcanzable.
    const target = options.loadTargetByExercise?.[exerciseId]
    const suppressedByEffort =
      (avgRpe !== undefined && avgRpe >= 8) || (avgRir !== undefined && avgRir <= 1)
    // Series pendientes de trabajo con peso: guard de las acciones de peso. No se «sube»
    // hacia abajo ni hacia un peso que el usuario ya escribió por encima del objetivo.
    const pendingWeights = (options.activeSets ?? [])
      .filter((s) => s.exerciseId === exerciseId && !s.completed && !s.isWarmup && s.weightKg > 0)
      .map((s) => s.weightKg)
    const maxPending = pendingWeights.length > 0 ? Math.max(...pendingWeights) : 0
    const minPending = pendingWeights.length > 0 ? Math.min(...pendingWeights) : 0
    if (target && !suppressedByEffort && target.weightKg > topWorking && target.weightKg > maxPending) {
      // Con esfuerzo real bajo se conserva el nudge; sin datos, mensaje neutro (no se
      // afirma «tienes margen» sobre algo que no se sabe).
      const withMargin =
        (avgRpe !== undefined && avgRpe <= 6) || (avgRpe === undefined && avgRir !== undefined && avgRir >= 2)
      suggestions.push({
        id: `increase-${exerciseId}`,
        type: 'increase',
        exerciseId,
        messageKey: withMargin ? 'suggestions.increaseWeight' : 'suggestions.increaseWeightNeutral',
        priority: 'high',
        data: { amount: roundToHalf(target.weightKg - topWorking), target: target.weightKg },
        capped: target.capped,
        action: { kind: 'applyWeight', targetKg: target.weightKg },
      })
    }

    // Sugerencia: bajar peso solo con esfuerzo REAL muy alto (F118: sin datos no se
    // inventa fatiga) y solo si TODAS las pendientes de trabajo quedan por encima del
    // objetivo: el tap fija el objetivo absoluto y no debe subir una serie más liviana.
    if ((avgRpe !== undefined && avgRpe >= 9.5) || (avgRir !== undefined && avgRir <= 0.5)) {
      const targetKg = roundToHalf(topWorking - 2.5)
      if (minPending > 0 && targetKg < minPending) {
        suggestions.push({
          id: `decrease-${exerciseId}`,
          type: 'decrease',
          exerciseId,
          messageKey: 'suggestions.decreaseWeight',
          priority: 'high',
          data: { amount: 2.5, target: targetKg },
          action: { kind: 'applyWeight', targetKg },
        })
      }
    }

    // Sugerencia: descansar más si el RPE REAL es alto. Los minutos vienen de la
    // recomendación compartida con Auto (F97.1); sin recomendación no se sugiere descanso.
    if (avgRpe !== undefined && avgRpe >= 8 && sets.length >= 3) {
      const minutes = options.restMinutesByExercise?.[exerciseId]
      if (minutes != null) {
        suggestions.push({
          id: `rest-${exerciseId}`,
          type: 'rest',
          exerciseId,
          messageKey: 'suggestions.restMore',
          priority: 'medium',
          data: { minutes },
        })
      }
    }

    // Sugerencia: series de válvula si cayó rendimiento.
    if (sets.length >= 3) {
      const earlyReps = sets.slice(0, 2).reduce((a, s) => a + s.reps, 0) / 2
      const lateReps = sets.slice(-2).reduce((a, s) => a + s.reps, 0) / 2
      if (lateReps < earlyReps * 0.7) {
        suggestions.push({
          id: `warning-${exerciseId}`,
          type: 'warning',
          exerciseId,
          messageKey: 'suggestions.performanceDrop',
          priority: 'medium',
        })
      }
    }
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}
