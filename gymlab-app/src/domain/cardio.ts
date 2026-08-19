// Cálculos de cardio: calorías, ritmo, distancia.
// Fórmula de calorías basada en METs: Calorías = METs × peso(kg) × tiempo(horas).

export interface CardioEntry {
  durationSeconds: number
  distanceMeters?: number
  weightKg: number
  metValue: number // valor MET del ejercicio (ej: correr=8.0, bici=6.0, remo=7.0)
}

export interface CardioResult {
  calories: number
  paceMinPerKm: number | null // minutos por km
  speedKmh: number | null // km por hora
}

// METs comunes para ejercicios de cardio.
export const metValues: Record<string, number> = {
  running: 8.0,
  cycling: 6.0,
  rowing: 7.0,
  swimming: 8.0,
  jumping_rope: 10.0,
  elliptical: 5.0,
  walking: 3.5,
  stair_climbing: 9.0,
  boxing: 7.5,
  generic: 5.0,
}

// Calcula calorías quemadas.
export const calcCalories = (entry: CardioEntry): number => {
  const hours = entry.durationSeconds / 3600
  return Math.round(entry.metValue * entry.weightKg * hours)
}

// Calcula ritmo (min/km).
export const calcPace = (durationSeconds: number, distanceMeters: number): number => {
  if (distanceMeters <= 0) return 0
  const km = distanceMeters / 1000
  return Math.round((durationSeconds / 60) / km * 10) / 10
}

// Calcula velocidad (km/h).
export const calcSpeed = (durationSeconds: number, distanceMeters: number): number => {
  if (durationSeconds <= 0) return 0
  const km = distanceMeters / 1000
  const hours = durationSeconds / 3600
  return Math.round((km / hours) * 10) / 10
}

// Calcula resultados completos de cardio.
export const calcCardioResult = (entry: CardioEntry): CardioResult => {
  const calories = calcCalories(entry)
  const paceMinPerKm = entry.distanceMeters
    ? calcPace(entry.durationSeconds, entry.distanceMeters)
    : null
  const speedKmh = entry.distanceMeters
    ? calcSpeed(entry.durationSeconds, entry.distanceMeters)
    : null

  return { calories, paceMinPerKm, speedKmh }
}
