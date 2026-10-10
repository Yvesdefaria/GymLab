/// <reference types="node" />
// 112.followups-2 (a) — R3-RESET-CONFIRM-GATE-TEST: el gate `!busy` del
// ResetConfirmSheet (backdrop, Escape y botones) no tenía test directo; el e2e
// de reset lo ejercita sin garantizar que el cierre quede bloqueado durante el
// wipe. Mismo patrón que f120w2Regression: el entorno de vitest es node (sin
// jsdom) y no se pueden disparar eventos reales, así que se audita el módulo
// FUENTE; si el gate se revierte, este test lo caza.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = fileURLToPath(new URL('../../../../src', import.meta.url))

// Quita comentarios para auditar CÓDIGO: la prosa nombra el gate y daría falsos positivos.
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

describe('ResetConfirmSheet — gate de busy (112a)', () => {
  it('el cierre (backdrop y Escape) pasa por requestClose y queda bloqueado con busy', () => {
    const sheet = stripComments(
      readFileSync(path.join(SRC, 'components/settings/ResetConfirmSheet.tsx'), 'utf8'),
    )
    // El callback del cierre consulta `busy` antes de llamar a onClose.
    expect(sheet).toMatch(/if \(!busy\) onClose\(\)/)
    // El hook de Escape recibe ESE callback (no `onClose` crudo).
    expect(sheet).toMatch(/useCloseOnEscape\(requestClose\)/)
    // El backdrop usa el mismo callback (no `onClose` crudo). El div del backdrop
    // es el primero del return: su primer onClick debe ser requestClose.
    expect(sheet).toMatch(/onClick=\{requestClose\}/)
    expect(sheet.match(/<div[^>]*onClick=\{([^}]*)\}/)?.[1]).toBe('requestClose')
  })

  it('el botón de confirmar queda deshabilitado con busy (y el X y Cancelar también)', () => {
    const sheet = stripComments(
      readFileSync(path.join(SRC, 'components/settings/ResetConfirmSheet.tsx'), 'utf8'),
    )
    // El botón destructivo exige la palabra Y que no esté busy.
    expect(sheet).toMatch(/disabled=\{!confirmed \|\| busy\}/)
    // X y Cancelar también cierran desde el padre: deshabilitados durante el wipe.
    expect(sheet.match(/disabled=\{busy\}/g)?.length).toBeGreaterThanOrEqual(2)
  })
})
