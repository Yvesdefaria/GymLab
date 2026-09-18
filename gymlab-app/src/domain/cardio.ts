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

// MET del ejercicio por subcadena del slug (inglés y español); genérico si no hay match.
// Fuente única compartida por el bloque de sesión y la comparativa de sesiones.
export const metForSlug = (slug: string): number => {
  const s = slug.toLowerCase()
  if (s.includes('running') || s.includes('correr')) return metValues.running
  if (s.includes('bicycling') || s.includes('bike') || s.includes('bici')) return metValues.cycling
  if (s.includes('rowing') || s.includes('remo')) return metValues.rowing
  if (s.includes('swimming') || s.includes('natación')) return metValues.swimming
  if (s.includes('rope') || s.includes('cuerda') || s.includes('jump')) return metValues.jumping_rope
  if (s.includes('elliptical') || s.includes('elíptica')) return metValues.elliptical
  if (s.includes('walking') || s.includes('camin')) return metValues.walking
  if (s.includes('stair') || s.includes('escal')) return metValues.stair_climbing
  if (s.includes('boxing') || s.includes('boxeo')) return metValues.boxing
  return metValues.generic
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
