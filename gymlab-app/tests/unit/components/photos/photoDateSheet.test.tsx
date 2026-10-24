// @vitest-environment jsdom
// Sheet de una fecha de fotos: tres ángulos, guardar en galería y eliminar.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@/i18n'
import { PhotoDateSheet } from '@/components/photos/PhotoDateSheet'
import type { ProgressPhotoEntry } from '@/domain/types'

const entry: ProgressPhotoEntry = {
  id: 1,
  localDate: '2026-10-24',
  frontUri: 'front',
  sideUri: null,
  backUri: null,
  createdAt: '2026-10-24T09:00:00.000Z',
}

afterEach(cleanup)

describe('PhotoDateSheet', () => {
  it('pinta los tres ángulos y guarda la fecha', () => {
    const onSave = vi.fn()
    render(
      <PhotoDateSheet
        entry={entry}
        saving={false}
        onClose={() => {}}
        onSaveToGallery={onSave}
        onDelete={() => {}}
      />,
    )

    expect(screen.getByText('Frente')).toBeTruthy()
    expect(screen.getByText('Lateral')).toBeTruthy()
    expect(screen.getByText('Espalda')).toBeTruthy()
    expect(screen.getAllByText('Sin foto')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Guardar en galería' }))
    expect(onSave).toHaveBeenCalledWith(entry)
  })

  it('elimina la fecha desde el sheet', () => {
    const onDelete = vi.fn()
    render(
      <PhotoDateSheet
        entry={entry}
        saving={false}
        onClose={() => {}}
        onSaveToGallery={() => {}}
        onDelete={onDelete}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar fecha' }))
    expect(onDelete).toHaveBeenCalledWith(entry)
  })
})
