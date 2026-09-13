// Tests del consejo de descanso (F97.1): convierte los segundos recomendados en minutos mostrados.
import { describe, expect, it } from 'vitest'
import { restAdviceMinutes } from '@/domain/restAdvice'

describe('restAdviceMinutes', () => {
  it('convierte la recomendación a minutos redondeando al más cercano', () => {
    expect(restAdviceMinutes(180)).toBe(3)
    expect(restAdviceMinutes(240)).toBe(4)
  })

  it('redondea fracciones de minuto al entero más cercano', () => {
    expect(restAdviceMinutes(90)).toBe(2)
    expect(restAdviceMinutes(135)).toBe(2)
    expect(restAdviceMinutes(150)).toBe(3)
  })

  it('nunca baja de un minuto', () => {
    expect(restAdviceMinutes(45)).toBe(1)
    expect(restAdviceMinutes(30)).toBe(1)
    expect(restAdviceMinutes(0)).toBe(1)
  })
})
