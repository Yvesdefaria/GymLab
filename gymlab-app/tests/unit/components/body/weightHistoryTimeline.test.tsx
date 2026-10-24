// @vitest-environment jsdom
// Historial de peso: 10 filas visibles de 15 y «Ver más» que expande sin remontar.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@/i18n'
import { WeightHistoryTimeline } from '@/components/body-log/WeightHistoryTimeline'
import type { BodyWeightEntry } from '@/domain/types'

const entries: BodyWeightEntry[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  localDate: `2026-10-${String(i + 1).padStart(2, '0')}`,
  weightKg: 70 + i * 0.5,
  createdAt: `2026-10-${String(i + 1).padStart(2, '0')}T09:00:00.000Z`,
}))

afterEach(cleanup)

describe('WeightHistoryTimeline', () => {
  it('muestra 10 registros y expande a 15 con Ver más', () => {
    render(<WeightHistoryTimeline entries={entries} units="kg" onRemove={() => {}} />)

    expect(screen.getAllByRole('button', { name: /Eliminar/ })).toHaveLength(10)

    fireEvent.click(screen.getByRole('button', { name: 'Ver más' }))
    expect(screen.getAllByRole('button', { name: /Eliminar/ })).toHaveLength(15)
  })

  it('borra el registro correcto', () => {
    const onRemove = vi.fn()
    render(<WeightHistoryTimeline entries={entries.slice(0, 2)} units="kg" onRemove={onRemove} />)

    fireEvent.click(screen.getAllByRole('button', { name: /Eliminar/ })[0])
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onRemove).toHaveBeenCalledWith(2)
  })
})
