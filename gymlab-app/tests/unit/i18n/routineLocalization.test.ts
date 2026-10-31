// Contrato de localización del catálogo de días: clave = id del seed; un id propio
// (sin entrada) conserva el texto del usuario; en español no se toca nada.
import { describe, expect, it } from 'vitest'
import { localizeRoutine, localizeRoutineDay } from '@/i18n/catalog'
import type { Routine, RoutineDay } from '@/domain/types'

const seedDay: RoutineDay = { id: 2, routineId: 1, dayIndex: 1, name: 'Pull (Espalda/Bíceps)' }
const customDay: RoutineDay = { id: 10001, routineId: 10000, dayIndex: 0, name: 'Mi día' }
const seedRoutine: Routine = {
  id: 1,
  slug: 'ppl-volumen',
  title: 'PPL Volumen',
  objective: 'volumen',
  level: 'intermedio',
  description: 'Push/Pull/Legs de 6 días para hipertrofia.',
  daysCount: 3,
}

describe('localizeRoutineDay', () => {
  it('traduce un día del seed por id en inglés', () => {
    expect(localizeRoutineDay(seedDay, 'en').name).toBe('Pull (Back/Biceps)')
  })

  it('un día propio conserva su nombre', () => {
    expect(localizeRoutineDay(customDay, 'en').name).toBe('Mi día')
  })

  it('en español devuelve el mismo día', () => {
    expect(localizeRoutineDay(seedDay, 'es')).toBe(seedDay)
  })
})

describe('localizeRoutine', () => {
  it('traduce título y descripción por slug en inglés', () => {
    expect(localizeRoutine(seedRoutine, 'en').title).toBe('PPL Volume')
  })

  it('en español devuelve la misma rutina', () => {
    expect(localizeRoutine(seedRoutine, 'es')).toBe(seedRoutine)
  })
})
