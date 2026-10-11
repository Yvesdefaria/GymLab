// @vitest-environment jsdom
// 112.followups-2 (a) — R3-RESET-CONFIRM-GATE-TEST (lote 13): el gate `!busy` del
// ResetConfirmSheet (backdrop, Escape y botones) deja de auditar la FUENTE y pasa a un
// test de comportamiento real: jsdom + RTL disparan clicks y teclas sobre el DOM y se
// observa qué cierra y qué no. El e2e de reset ejercita el flujo completo, pero no
// garantiza que el cierre quede bloqueado durante el wipe; acá busy=true bloquea
// backdrop, Escape y los tres botones.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { ResetConfirmSheet } from '@/components/settings/ResetConfirmSheet'
import { setHapticsBackend } from '@/lib/haptics'

// El componente solo usa `t`; se mockea para no cargar los bundles de idioma.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// Spies tipados contra la firma real del backend: el Mock ancho de `vi.fn()` no
// satisface `HapticsBackend` y rompería el typecheck del build.
type HapticsSpy = Mock<(pattern: number | number[]) => void>
let native: HapticsSpy
let web: HapticsSpy

beforeEach(() => {
  // Backend fake de haptics: observa el despacho del gesto destructivo sin APIs reales.
  native = vi.fn()
  web = vi.fn()
  setHapticsBackend({ native, web })
})

afterEach(() => {
  // El repo no usa `globals: true`: RTL no auto-limpia, hay que desmontar a mano.
  cleanup()
  setHapticsBackend(null)
})

const renderSheet = (busy: boolean) => {
  const onConfirm = vi.fn()
  const onClose = vi.fn()
  const view = render(
    <ResetConfirmSheet busy={busy} error={false} onConfirm={onConfirm} onClose={onClose} />
  )
  const dialog = view.container.querySelector('[role="alertdialog"]') as HTMLElement
  return {
    onConfirm,
    onClose,
    view,
    dialog,
    // El backdrop es el div raíz (`fixed`); el diálogo es su hijo con stopPropagation.
    backdrop: dialog.parentElement as HTMLElement,
  }
}

const buttonByText = (dialog: HTMLElement, text: string): HTMLButtonElement =>
  Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent === text) as HTMLButtonElement

describe('ResetConfirmSheet — gate de busy (comportamiento DOM)', () => {
  it('el click en el backdrop cierra solo sin busy', () => {
    const unlocked = renderSheet(false)
    fireEvent.click(unlocked.backdrop)
    expect(unlocked.onClose).toHaveBeenCalledTimes(1)
    unlocked.view.unmount()

    const locked = renderSheet(true)
    fireEvent.click(locked.backdrop)
    expect(locked.onClose).not.toHaveBeenCalled()
  })

  it('Escape cierra solo sin busy (el hook escucha en window)', () => {
    const unlocked = renderSheet(false)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(unlocked.onClose).toHaveBeenCalledTimes(1)
    unlocked.view.unmount()

    const locked = renderSheet(true)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(locked.onClose).not.toHaveBeenCalled()
  })

  it('con busy=true el X, Cancelar y el destructivo quedan deshabilitados', () => {
    const { dialog } = renderSheet(true)
    const closeButton = dialog.querySelector(
      'button[aria-label="layout.confirm.close"]'
    ) as HTMLButtonElement
    const destructive = buttonByText(dialog, 'ajustes.resetEnProgreso')
    const cancel = buttonByText(dialog, 'ajustes.cancelar')

    expect(closeButton.disabled).toBe(true)
    expect(destructive.disabled).toBe(true)
    expect(cancel.disabled).toBe(true)
  })

  it('BORRAR habilita el destructivo y su click confirma con haptics', () => {
    const { onConfirm, onClose, dialog } = renderSheet(false)
    const input = dialog.querySelector('input') as HTMLInputElement
    const destructive = buttonByText(dialog, 'ajustes.resetConfirmBoton')

    // Palabra incorrecta: sigue deshabilitado (type-to-confirm real).
    fireEvent.change(input, { target: { value: 'borrad' } })
    expect(destructive.disabled).toBe(true)

    fireEvent.change(input, { target: { value: 'BORRAR' } })
    expect(destructive.disabled).toBe(false)

    fireEvent.click(destructive)
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(web).toHaveBeenCalledWith(30)
    expect(native).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})
