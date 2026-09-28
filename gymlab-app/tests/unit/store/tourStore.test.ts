import { beforeEach, describe, expect, it } from 'vitest'
import { useTourStore } from '@/store/tourStore'

describe('tourStore', () => {
  beforeEach(() => useTourStore.getState().close())

  it('arranca cerrado', () => {
    expect(useTourStore.getState().source).toBeNull()
  })

  it('start registra el origen (auto/replay)', () => {
    useTourStore.getState().start('auto')
    expect(useTourStore.getState().source).toBe('auto')
    useTourStore.getState().start('replay')
    expect(useTourStore.getState().source).toBe('replay')
  })

  it('close lo apaga', () => {
    useTourStore.getState().start('replay')
    useTourStore.getState().close()
    expect(useTourStore.getState().source).toBeNull()
  })
})
