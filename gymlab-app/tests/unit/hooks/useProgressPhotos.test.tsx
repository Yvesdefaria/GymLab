// @vitest-environment jsdom
// El hook compartido de fotos es el único punto que materializa la tabla en las
// rutas que la renderizan: la sanitización tiene que estar cableada ahí, no solo
// en la función pura.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'

const state = vi.hoisted(() => ({
  query: null as null | (() => Promise<unknown[]> | unknown[]),
}))

vi.mock('@/hooks/useLiveList', () => ({
  useLiveList: (query: () => Promise<unknown[]> | unknown[]) => {
    state.query = query
    return []
  },
}))

vi.mock('@/data/repositories', () => ({
  progressPhotoRepo: {
    getAll: vi.fn(async () => [
      {
        id: 1,
        localDate: '2026-11-06',
        frontUri: 'data:image/jpeg;base64,AAA',
        sideUri: 'https://collector.example/x.png',
        backUri: 'file:///data/user/0/com.gymlab.app/cache/x.png',
        createdAt: '2026-11-06T09:00:00.000Z',
      },
    ]),
  },
}))

import { useProgressPhotoList } from '@/hooks/useProgressPhotos'

describe('useProgressPhotoList', () => {
  afterEach(cleanup)

  it('nulifica las URIs restauradas que no son data:image', async () => {
    renderHook(() => useProgressPhotoList())
    expect(state.query).not.toBeNull()
    const rows = (await state.query!()) as Array<Record<string, unknown>>
    expect(rows[0]).toMatchObject({
      frontUri: 'data:image/jpeg;base64,AAA',
      sideUri: null,
      backUri: null,
    })
  })
})
