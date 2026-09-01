// Dominio del formulario de reporte de errores: validación y cuerpo del correo.

export type ReportType = 'error' | 'mejora' | 'otro'

export const REPORT_MIN_LENGTH = 10

export interface ReportInput {
  type: ReportType
  description: string
  email?: string
}

export interface ReportValidation {
  valid: boolean
  error?: string
}

// La descripción es obligatoria (mín. 10 caracteres); el email opcional.
export const validateReport = (description: string, _type: ReportType): ReportValidation => {
  const trimmed = description.trim()
  if (trimmed.length < REPORT_MIN_LENGTH) {
    return { valid: false, error: 'reporte.errorDescripcion' }
  }
  return { valid: true }
}

// Cuerpo del correo con el reporte preformateado (tipo, descripción, email).
export const buildReportBody = (type: ReportType, description: string, email?: string): string => {
  const lines = [
    `Tipo: ${type}`,
    `Descripción: ${description.trim()}`,
  ]
  if (email?.trim()) lines.push(`Contacto: ${email.trim()}`)
  return lines.join('\n')
}
