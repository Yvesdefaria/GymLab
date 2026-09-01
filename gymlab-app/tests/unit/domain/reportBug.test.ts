// Valida la construcción del reporte de errores: campos, validación del cuerpo
// y generación del mailto con el reporte preformateado.
import { describe, expect, it } from 'vitest'
import { buildReportBody, validateReport } from '@/domain/report'

describe('validateReport', () => {
  it('rechaza descripción vacía o demasiado corta', () => {
    expect(validateReport('', 'error').valid).toBe(false)
    expect(validateReport('corto', 'error').valid).toBe(false)
  })

  it('acepta descripción con mínimo de 10 caracteres y tipo válido', () => {
    expect(validateReport('La app se cierra al registrar', 'error').valid).toBe(true)
  })
})

describe('buildReportBody', () => {
  it('incluye tipo, descripción y (si hay) email de contacto', () => {
    const body = buildReportBody('error', 'La app se cierra al registrar', 'user@x.com')
    expect(body).toContain('La app se cierra al registrar')
    expect(body).toContain('user@x.com')
  })
})
