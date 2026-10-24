// @vitest-environment jsdom
// Héroe de /peso-corporal: peso del rango, delta y estado vacío honesto.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import '@/i18n'
import { WeightHero } from '@/components/body-log/WeightHero'
import type { BodyWeightEntry } from '@/domain/types'

const entry: BodyWeightEntry = {
  id: 1,
  localDate: '2026-10-24',
  weightKg: 78.4,
  createdAt: '2026-10-24T09:00:00.000Z',
}

afterEach(cleanup)

describe('WeightHero', () => {
  it('pinta el peso y el delta del rango activo', () => {
    render(
      <WeightHero
        latest={entry}
        deltaKg={-1.8}
        range={30}
        units="kg"
        today="2026-10-24"
        lang="es"
      />,
    )
    expect(screen.getByText('78.4')).toBeTruthy()
    expect(screen.getByText(/1\.8/)).toBeTruthy()
    expect(screen.getByText(/30/)).toBeTruthy()
  })

  it('sin registros muestra el guion y el aviso del rango', () => {
    render(
      <WeightHero
        latest={null}
        deltaKg={null}
        range={30}
        units="kg"
        today="2026-10-24"
        lang="es"
      />,
    )
    expect(screen.getByText('—')).toBeTruthy()
    expect(screen.getByText(/Sin registros en este rango/)).toBeTruthy()
  })

  it('con un solo registro no inventa delta', () => {
    render(
      <WeightHero
        latest={entry}
        deltaKg={null}
        range={30}
        units="kg"
        today="2026-10-24"
        lang="es"
      />,
    )
    expect(screen.queryByText(/1\.8/)).toBeNull()
  })
})
