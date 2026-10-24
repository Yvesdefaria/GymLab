// @vitest-environment jsdom
// Delta de peso del comparador: dos pesos y el signo del cambio, sin inventar ceros.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import '@/i18n'
import { CompareWeightDelta } from '@/components/photos/CompareWeightDelta'

afterEach(cleanup)

describe('CompareWeightDelta', () => {
  it('pinta los dos pesos y el delta negativo', () => {
    render(
      <CompareWeightDelta
        delta={{ fromKg: 80.5, toKg: 78.4, deltaKg: -2.1 }}
        units="kg"
      />,
    )
    expect(screen.getByText(/Peso/)).toBeTruthy()
    expect(screen.getByText(/80\.5/)).toBeTruthy()
    expect(screen.getByText(/78\.4/)).toBeTruthy()
    expect(screen.getByText(/-2\.1/)).toBeTruthy()
  })

  it('antepone + cuando el peso sube', () => {
    render(
      <CompareWeightDelta delta={{ fromKg: 78, toKg: 80, deltaKg: 2 }} units="kg" />,
    )
    expect(screen.getByText(/\+2\.0/)).toBeTruthy()
  })
})
