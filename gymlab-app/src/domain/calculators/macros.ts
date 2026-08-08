// Distribución de macronutrientes (kcal, proteína, grasas, carbohidratos) según objetivo y TDEE.
import { calcTDEE, type NivelActividad, type Sexo } from '@/domain/calculators/tdee'

export type MacroObjetivo = 'volumen' | 'definicion' | 'mantenimiento'

export const macroObjetivoLabel: Record<MacroObjetivo, string> = {
  volumen: 'Volumen (superávit)',
  definicion: 'Definición (déficit)',
  mantenimiento: 'Mantenimiento',
}

export interface MacroResult {
  calorias: number
  proteina: number
  grasas: number
  carbohidratos: number
}

const FACTOR_CALORIAS: Record<MacroObjetivo, number> = {
  volumen: 1.1,
  definicion: 0.8,
  mantenimiento: 1,
}

const GRAMOS_PROTEINA: Record<MacroObjetivo, number> = {
  volumen: 1.8,
  definicion: 2.2,
  mantenimiento: 1.8,
}

// Distribución orientativa: proteína alta, grasas 0,8 g/kg y el resto de
// calorías como carbohidratos.
// Calcula las calorías objetivo (TDEE × factor del objetivo) y reparte macros:
// proteína alta, grasas a 0,8 g/kg y el resto de calorías como carbohidratos.
export const calcMacros = (
  pesoKg: number,
  alturaCm: number,
  edad: number,
  sexo: Sexo,
  actividad: NivelActividad,
  objetivo: MacroObjetivo
): MacroResult => {
  if (pesoKg <= 0 || alturaCm <= 0 || edad <= 0) {
    return { calorias: 0, proteina: 0, grasas: 0, carbohidratos: 0 }
  }
  const calorias = Math.round(calcTDEE(pesoKg, alturaCm, edad, sexo, actividad) * FACTOR_CALORIAS[objetivo])
  const proteina = Math.round(pesoKg * GRAMOS_PROTEINA[objetivo])
  const grasas = Math.round(pesoKg * 0.8)
  const carbohidratos = Math.max(0, Math.round((calorias - proteina * 4 - grasas * 9) / 4))
  return { calorias, proteina, grasas, carbohidratos }
}
