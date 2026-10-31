// @vitest-environment jsdom
// Localización del héroe de la home: el día del seed se muestra en el idioma de la UI
// y un día propio conserva el texto del usuario.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { applyLanguage } from '@/i18n'
import '@/i18n'
import { HeroCard } from '@/components/home/HeroCard'
import type { RoutineDay } from '@/domain/types'

const seedDay: RoutineDay = { id: 2, routineId: 1, dayIndex: 1, name: 'Pull (Espalda/Bíceps)' }
const customDay: RoutineDay = { id: 10001, routineId: 10000, dayIndex: 0, name: 'Mi día de espalda' }

const renderHero = (todayDay: RoutineDay | null) =>
  render(
    <MemoryRouter>
      <HeroCard
        heroImage="/images/routines/ppl-volumen.jpg"
        hasActiveWorkout={false}
        todayDone={false}
        todayDay={todayDay}
        todayGroups={[]}
        program={null}
        sessionPct={0}
        programPct={0}
        onStart={() => {}}
        onChangeDay={() => {}}
        onContinue={() => {}}
      />
    </MemoryRouter>,
  )

beforeAll(async () => {
  await applyLanguage('en')
})

afterAll(async () => {
  await applyLanguage('es')
})

afterEach(cleanup)

describe('HeroCard localizado', () => {
  it('en inglés muestra el nombre EN del día del seed', () => {
    renderHero(seedDay)
    expect(screen.getByText('Pull (Back/Biceps)')).toBeTruthy()
    expect(screen.queryByText('Pull (Espalda/Bíceps)')).toBeNull()
  })

  it('un día propio conserva el texto del usuario', () => {
    renderHero(customDay)
    expect(screen.getByText('Mi día de espalda')).toBeTruthy()
  })
})
