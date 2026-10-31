// @vitest-environment jsdom
// Selector de destino del alta desde catálogo: rutina y días del seed en el idioma de la UI.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { applyLanguage } from '@/i18n'
import '@/i18n'
import { RoutineDestinationSheet } from '@/components/routines/RoutineDestinationSheet'

// Los hooks leen Dexie en producción; acá se fija el caso: rutina del seed y su día.
vi.mock('@/hooks/useRoutines', () => ({
  useRoutines: () => ({
    routines: [
      {
        id: 1,
        slug: 'ppl-volumen',
        title: 'PPL Volumen',
        objective: 'volumen',
        level: 'intermedio',
        description: '',
        daysCount: 3,
      },
    ],
  }),
  useRoutineDays: () => ({
    days: [{ id: 2, routineId: 1, dayIndex: 1, name: 'Pull (Espalda/Bíceps)' }],
  }),
}))

beforeAll(async () => {
  await applyLanguage('en')
})

afterAll(async () => {
  await applyLanguage('es')
})

afterEach(cleanup)

describe('RoutineDestinationSheet localizado', () => {
  it('en inglés muestra el título EN de la rutina y el día EN del seed', () => {
    render(<RoutineDestinationSheet exerciseName="Press banca" onChooseDay={() => {}} onClose={() => {}} />)

    fireEvent.click(screen.getByText('PPL Volume'))

    expect(screen.getByText('Pull (Back/Biceps)')).toBeTruthy()
    expect(screen.queryByText('Pull (Espalda/Bíceps)')).toBeNull()
  })
})
