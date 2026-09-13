// Sugerencias inteligentes en sesión: analiza series completadas y sugiere ajustes.
export type SuggestionType = 'increase' | 'decrease' | 'rest' | 'switch' | 'warning' | 'warmup'

// Acción ejecutable que acompaña a la sugerencia (botón de un toque).
export type SuggestionAction =
  | { kind: 'applyWeight'; amountKg: number }
  | { kind: 'addWarmupSet'; warmupWeightKg: number }

export interface SessionSuggestion {
  id: string
  type: SuggestionType
  exerciseId: number
  messageKey: string
  priority: 'high' | 'medium' | 'low'
  data?: Record<string, string | number>
  action?: SuggestionAction
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
  loadTargetByExercise?: Record<number, number>
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
// completadas con peso, siempre marcadas como completadas (el motor filtra por ese flag).
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
    }[]
  }[]
): SuggestionSetInput[] =>
  exercises.flatMap((ex) =>
    ex.sets
      .filter((s) => s.completed && s.weightKg > 0)
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

    if (sets.length < 2) continue

    const lastSet = sets[sets.length - 1]
    const firstSet = sets[0]
    const avgRpe = sets.reduce((acc, s) => acc + (s.rpe ?? 7), 0) / sets.length
    const avgRir = sets.reduce((acc, s) => acc + (s.rir ?? 2), 0) / sets.length

    // Sugerencia: subir peso si RPE bajo y consistencia, con la MAGNITUD del motor único
    // (F97.2): el overlay no calcula su propio peso, toma el objetivo de `recommendLoad`.
    if (avgRpe <= 6 && lastSet.weightKg === firstSet.weightKg) {
      const target = options.loadTargetByExercise?.[exerciseId]
      if (target != null && target > lastSet.weightKg) {
        const amount = roundToHalf(target - lastSet.weightKg)
        suggestions.push({
          id: `increase-${exerciseId}`,
          type: 'increase',
          exerciseId,
          messageKey: 'suggestions.increaseWeight',
          priority: 'high',
          data: { amount },
          action: { kind: 'applyWeight', amountKg: amount },
        })
      }
    }

    // Sugerencia: bajar peso si RPE muy alto.
    if (avgRpe >= 9.5 || avgRir <= 0.5) {
      suggestions.push({
        id: `decrease-${exerciseId}`,
        type: 'decrease',
        exerciseId,
        messageKey: 'suggestions.decreaseWeight',
        priority: 'high',
        data: { amount: 2.5 },
        action: { kind: 'applyWeight', amountKg: -2.5 },
      })
    }

    // Sugerencia: descansar más si RPE alto. Los minutos vienen de la recomendación
    // compartida con Auto (F97.1); sin recomendación no se sugiere descanso.
    if (avgRpe >= 8 && sets.length >= 3) {
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
