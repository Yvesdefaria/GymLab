// Definiciones únicas de qué serie entra en cada métrica. Ningún consumidor debe
// repetir estos filtros: si una métrica necesita otra política, se agrega acá y se
// documenta en el contrato de métricas.

export interface SetLike {
  completed: boolean
  isWarmup?: boolean
  weightKg: number
  reps: number
  durationSeconds?: number
}

// Serie de trabajo: completada, sin calentamiento y con peso y reps positivas.
// Es la base de PR, e1RM, volumen, fatiga, comparador y progresión (decisión D2).
export const isWorkingSet = (set: SetLike): boolean =>
  set.completed && !set.isWarmup && set.weightKg > 0 && set.reps > 0

// Serie completada, incluya o no calentamiento. Solo para métricas informativas.
export const isCompletedSet = (set: SetLike): boolean => set.completed

// Serie de cardio: se mide por duración, no por peso × reps.
export const isCardioSet = (set: SetLike): boolean => (set.durationSeconds ?? 0) > 0
