// Sugerencias inteligentes en sesión: analiza series completadas y sugiere ajustes.
export type SuggestionType = 'increase' | 'decrease' | 'rest' | 'switch' | 'warning'

export interface SessionSuggestion {
  id: string
  type: SuggestionType
  exerciseId: number
  messageKey: string
  priority: 'high' | 'medium' | 'low'
  data?: Record<string, string | number>
}

export interface CompletedSet {
  exerciseId: number
  weightKg: number
  reps: number
  rpe?: number
  rir?: number
  setNumber: number
}

// Analiza series completadas y genera sugerencias.
export const generateSuggestions = (
  completedSets: CompletedSet[]
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
    if (sets.length < 2) continue

    const lastSet = sets[sets.length - 1]
    const firstSet = sets[0]
    const avgRpe = sets.reduce((acc, s) => acc + (s.rpe ?? 7), 0) / sets.length
    const avgRir = sets.reduce((acc, s) => acc + (s.rir ?? 2), 0) / sets.length

    // Sugerencia: subir peso si RPE bajo y consistencia.
    if (avgRpe <= 6 && lastSet.weightKg === firstSet.weightKg) {
      suggestions.push({
        id: `increase-${exerciseId}`,
        type: 'increase',
        exerciseId,
        messageKey: 'suggestions.increaseWeight',
        priority: 'high',
        data: { amount: 2.5 },
      })
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
      })
    }

    // Sugerencia: descansar más si RPE alto.
    if (avgRpe >= 8 && sets.length >= 3) {
      suggestions.push({
        id: `rest-${exerciseId}`,
        type: 'rest',
        exerciseId,
        messageKey: 'suggestions.restMore',
        priority: 'medium',
        data: { minutes: 3 },
      })
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
