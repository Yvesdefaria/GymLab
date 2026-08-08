// Calculadora de TDEE (gasto energético diario) con la ecuación Mifflin-St Jeor.
export type Sexo = 'hombre' | 'mujer'

export type NivelActividad =
  | 'sedentario'
  | 'ligero'
  | 'moderado'
  | 'intenso'
  | 'muy_intenso'

const FACTORES_ACTIVIDAD: Record<NivelActividad, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  intenso: 1.725,
  muy_intenso: 1.9,
}

export const nivelActividadLabel: Record<NivelActividad, string> = {
  sedentario: 'Sedentario (poco o nada de ejercicio)',
  ligero: 'Ligeramente activo (1–3 días/semana)',
  moderado: 'Moderadamente activo (3–5 días/semana)',
  intenso: 'Activo (6–7 días/semana)',
  muy_intenso: 'Muy activo (entrenamiento intenso diario)',
}

// Mifflin-St Jeor (más preciso que Harris-Benedict)
export const calcBMR = (
  pesoKg: number,
  alturaCm: number,
  edad: number,
  sexo: Sexo
): number => {
  if (pesoKg <= 0 || alturaCm <= 0 || edad <= 0) return 0
  const base = 10 * pesoKg + 6.25 * alturaCm - 5 * edad
  return sexo === 'hombre' ? base + 5 : base - 161
}

// TDEE = BMR × factor de actividad (el gasto diario total estimado).
export const calcTDEE = (
  pesoKg: number,
  alturaCm: number,
  edad: number,
  sexo: Sexo,
  actividad: NivelActividad
): number => {
  return Math.round(calcBMR(pesoKg, alturaCm, edad, sexo) * FACTORES_ACTIVIDAD[actividad])
}

export interface TDEEResult {
  bmr: number
  tdee: number
  deficit: number
  superavit: number
}

// Rango de calorías útil: mantenimiento, déficit (~20 %) y superávit (~15 %).
export const calcTDEERange = (
  pesoKg: number,
  alturaCm: number,
  edad: number,
  sexo: Sexo,
  actividad: NivelActividad
): TDEEResult => {
  const tdee = calcTDEE(pesoKg, alturaCm, edad, sexo, actividad)
  return {
    bmr: Math.round(tdee / FACTORES_ACTIVIDAD[actividad]),
    tdee,
    deficit: Math.round(tdee * 0.8),   // ~20% déficit
    superavit: Math.round(tdee * 1.15), // ~15% superávit
  }
}
