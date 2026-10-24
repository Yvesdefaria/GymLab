// @vitest-environment jsdom
// Timeline de fotos: 10 filas de 15, «Ver más» y apertura de la fecha correcta.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@/i18n'
import { ProgressPhotosTimeline } from '@/components/photos/ProgressPhotosTimeline'
import type { ProgressPhotoEntry } from '@/domain/types'

const photos: ProgressPhotoEntry[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  localDate: `2026-10-${String(i + 1).padStart(2, '0')}`,
  frontUri: 'front',
  sideUri: i % 2 === 0 ? 'side' : null,
  backUri: null,
  createdAt: `2026-10-${String(i + 1).padStart(2, '0')}T09:00:00.000Z`,
}))
const sorted = [...photos].sort((a, b) => b.localDate.localeCompare(a.localDate))

afterEach(cleanup)

describe('ProgressPhotosTimeline', () => {
  it('muestra 10 fechas y expande a 15 con Ver más', () => {
    const { container } = render(<ProgressPhotosTimeline photos={sorted} onOpen={() => {}} />)

    expect(container.querySelectorAll('[data-photo-date]')).toHaveLength(10)

    fireEvent.click(screen.getByRole('button', { name: 'Ver más' }))
    expect(container.querySelectorAll('[data-photo-date]')).toHaveLength(15)
  })

  it('abre la fecha tocada', () => {
    const onOpen = vi.fn()
    const { container } = render(
      <ProgressPhotosTimeline photos={sorted.slice(0, 2)} onOpen={onOpen} />,
    )

    const rows = container.querySelectorAll<HTMLButtonElement>('[data-photo-date]')
    fireEvent.click(rows[0])
    expect(onOpen).toHaveBeenCalledWith(sorted[0])
  })
})
