// Calculadora de IMC (índice de masa corporal) y sus categorías de referencia.
export type IMCCategory = 'bajo_peso' | 'normal' | 'sobrepeso' | 'obesidad'

// IMC = peso (kg) / altura (m)², redondeado a 1 decimal.
export const calcIMC = (pesoKg: number, alturaCm: number): number => {
  if (pesoKg <= 0 || alturaCm <= 0) return 0
  const alturaM = alturaCm / 100
  return Math.round((pesoKg / (alturaM * alturaM)) * 10) / 10
}

// Umbrales de categoría IMC según la OMS: bajo_peso < 18,5 ≤ normal < 25 ≤ sobrepeso < 30 ≤ obesidad.
export const IMC_THRESHOLDS = [18.5, 25, 30]

// Categoría de IMC según los rangos estándar de la OMS.
export const getIMCCategory = (imc: number): IMCCategory => {
  if (imc < IMC_THRESHOLDS[0]) return 'bajo_peso'
  if (imc < IMC_THRESHOLDS[1]) return 'normal'
  if (imc < IMC_THRESHOLDS[2]) return 'sobrepeso'
  return 'obesidad'
}

export const imcCategoryLabel = (cat: IMCCategory): string => {
  const labels: Record<IMCCategory, string> = {
    bajo_peso: 'Bajo peso',
    normal: 'Peso normal',
    sobrepeso: 'Sobrepeso',
    obesidad: 'Obesidad',
  }
  return labels[cat]
}

export const imcCategoryColor = (cat: IMCCategory): string => {
  const colors: Record<IMCCategory, string> = {
    bajo_peso: 'var(--color-info)',
    normal: 'var(--color-success)',
    sobrepeso: 'var(--color-cta)',
    obesidad: 'var(--color-danger)',
  }
  return colors[cat]
}
