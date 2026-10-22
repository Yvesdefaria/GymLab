// @vitest-environment jsdom
// F127: el tour manda en el primer arranque. Un logro que salta mientras el
// tour está abierto no debe montar su modal (dos aria-modal compiten por foco y
// el velo del logro tapa justo lo que el tour señala); la cola queda retenida
// en el hook y se celebra al cerrar el tour.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { useTourStore } from '@/store/tourStore'

vi.mock('@/hooks/useAchievements', () => ({
  useAchievements: () => ({
    achievements: [
      {
        id: 'cuerpo-primer-peso',
        titleKey: 'achievements.items.cuerpoPrimerPeso.title',
        descriptionKey: 'achievements.items.cuerpoPrimerPeso.desc',
        icon: 'Scale',
      },
    ],
    dismiss: () => {},
    counts: {},
    newGranted: [],
  }),
}))

// El modal real trae animejs/haptics y no aporta a esta regla: se pinnea que
// el host lo monte o no según el tour.
vi.mock('@/components/achievements/AchievementModal', () => ({
  AchievementModal: () => <div data-testid="achievement-modal" />,
}))

import { AchievementsHost } from '@/components/achievements/AchievementsHost'

describe('AchievementsHost con el tour abierto', () => {
  beforeEach(() => useTourStore.getState().close())
  afterEach(() => {
    cleanup()
    useTourStore.getState().close()
  })

  it('retiene el modal durante el tour y lo muestra al cerrarlo', async () => {
    render(<AchievementsHost />)
    expect(await screen.findByTestId('achievement-modal')).toBeTruthy()

    act(() => useTourStore.getState().start('auto'))
    expect(screen.queryByTestId('achievement-modal')).toBeNull()

    act(() => useTourStore.getState().close())
    expect(await screen.findByTestId('achievement-modal')).toBeTruthy()
  })

  it('también lo retiene en un replay del tour', async () => {
    act(() => useTourStore.getState().start('replay'))
    render(<AchievementsHost />)
    expect(await screen.findByTestId('achievement-modal').catch(() => null)).toBeNull()

    act(() => useTourStore.getState().close())
    expect(await screen.findByTestId('achievement-modal')).toBeTruthy()
  })
})
