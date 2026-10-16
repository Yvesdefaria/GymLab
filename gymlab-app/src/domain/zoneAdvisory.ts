// F122 — Aviso de zona: velocidad del peso de trabajo agrupada por músculo. Es informativo:
// nunca retiene propuestas (el freno es por ejercicio); solo aparece cuando la zona viene
// subiendo por encima del umbral sostenible. Puro: sin React, sin Dexie.
import {
  VELOCITY_THRESHOLD_PCT_PER_WEEK,
  workingVelocityPctPerWeek,
  type WorkingSetLike,
} from './workingProgression'

export interface ZoneAdvisory {
  zone: string
  pctPerWeek: number
}

// Zonas con velocidad máxima (entre sus ejercicios) por encima del umbral, ordenadas desc.
export const buildZoneAdvisories = ({
  setsByExercise,
  muscleByExerciseId,
  now = new Date(),
}: {
  setsByExercise: Map<number, WorkingSetLike[]>
  muscleByExerciseId: Map<number, string>
  now?: Date
}): ZoneAdvisory[] => {
  const maxByZone = new Map<string, number>()
  for (const [exerciseId, sets] of setsByExercise) {
    const zone = muscleByExerciseId.get(exerciseId)
    if (!zone) continue
    const velocity = workingVelocityPctPerWeek(sets, now)
    if (velocity === null) continue
    const current = maxByZone.get(zone)
    if (current === undefined || velocity > current) maxByZone.set(zone, velocity)
  }
  return [...maxByZone.entries()]
    .filter(([, pctPerWeek]) => pctPerWeek > VELOCITY_THRESHOLD_PCT_PER_WEEK)
    .map(([zone, pctPerWeek]) => ({ zone, pctPerWeek }))
    .sort((a, b) => b.pctPerWeek - a.pctPerWeek)
}
