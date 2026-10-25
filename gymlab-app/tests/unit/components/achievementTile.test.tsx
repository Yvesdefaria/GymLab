// @vitest-environment jsdom
// F132.4: tarjeta de la vitrina de logros. Pinnea que el progreso declarativo
// siga vivo en la tarjeta (mismos data-progress/aria que el e2e) y que un
// target 0 no pinte una barra vacía ni un «0 de 0».
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { i18n } from '@/i18n'
import { AchievementTile } from '@/components/achievements/AchievementTile'
import type { Achievement } from '@/domain/achievements'

const ACH: Achievement = {
  id: 'primer-paso',
  titleKey: 'achievements.items.primerPaso.title',
  descriptionKey: 'achievements.items.primerPaso.desc',
  icon: 'Footprints',
}

beforeEach(async () => {
  await i18n.changeLanguage('es')
})

afterEach(() => cleanup())

describe('AchievementTile', () => {
  it('omite la barra cuando el target es 0', () => {
    render(
      <AchievementTile
        achievement={ACH}
        unlocked={false}
        count={0}
        progress={{ id: ACH.id, current: 0, target: 0, completed: false }}
        lang="es"
        onOpen={() => {}}
      />
    )
    expect(document.querySelector('[data-progress="primer-paso"]')).toBeNull()
    expect(screen.queryByText(/de 0/)).toBeNull()
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('muestra ×N y la barra accesible cuando hay progreso', () => {
    render(
      <AchievementTile
        achievement={ACH}
        unlocked
        count={3}
        progress={{ id: ACH.id, current: 1, target: 1, completed: true }}
        lang="es"
        onOpen={() => {}}
      />
    )
    expect(screen.getByText('×3')).not.toBeNull()
    // El botón estirado no debe volver presentacional la barra: ambos roles
    // tienen que estar expuestos en el árbol de accesibilidad (R3-A11Y-PROGRESS).
    expect(screen.getByRole('button', { name: 'Primer paso' })).not.toBeNull()
    expect(screen.getByRole('progressbar')).not.toBeNull()
    const bar = document.querySelector('[data-progress="primer-paso"]')
    expect(bar?.getAttribute('role')).toBe('progressbar')
    expect(bar?.getAttribute('aria-valuenow')).toBe('1')
    expect(bar?.getAttribute('aria-valuemax')).toBe('1')
  })

  it('mantiene el metal y el estado bloqueado en la medalla', () => {
    render(<AchievementTile achievement={ACH} unlocked={false} count={0} lang="es" onOpen={() => {}} />)
    const medal = document.querySelector('[data-achievement="primer-paso"]')
    const label = medal?.getAttribute('aria-label') ?? ''
    expect(label).toContain('bronce')
    expect(label).toContain('chapa bloqueada')
  })
})
