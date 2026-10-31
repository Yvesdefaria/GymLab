// @vitest-environment jsdom
// Selector de día de la home: los nombres del seed se muestran en el idioma de la UI.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { applyLanguage } from '@/i18n'
import '@/i18n'
import { DaySelectorSheet } from '@/components/home/DaySelectorSheet'
import type { RoutineDay } from '@/domain/types'

const days: RoutineDay[] = [
  { id: 1, routineId: 1, dayIndex: 0, name: 'Push (Pecho/Hombro/Tríceps)' },
  { id: 2, routineId: 1, dayIndex: 1, name: 'Pull (Espalda/Bíceps)' },
  { id: 10001, routineId: 10000, dayIndex: 0, name: 'Día propio' },
]

beforeAll(async () => {
  await applyLanguage('en')
})

afterAll(async () => {
  await applyLanguage('es')
})

afterEach(cleanup)

describe('DaySelectorSheet localizado', () => {
  it('en inglés traduce los días del seed y respeta los propios', () => {
    render(
      <DaySelectorSheet days={days} routineName="PPL Volume" onSelectDay={() => {}} onClose={() => {}} />,
    )

    expect(screen.getByText('Push (Chest/Shoulders/Triceps)')).toBeTruthy()
    expect(screen.getByText('Pull (Back/Biceps)')).toBeTruthy()
    expect(screen.getByText('Día propio')).toBeTruthy()
    expect(screen.queryByText('Push (Pecho/Hombro/Tríceps)')).toBeNull()
  })
})
