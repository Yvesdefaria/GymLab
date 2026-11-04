/// <reference types="node" />
// F136.7 — «Salir sin guardar» debe descartar la sesión activa, no solo navegar.
// Invariante de FUENTE: el hook es difícil de montar en node (Dexie/router), y el
// bug era exactamente la ausencia del reset entre el cierre de la hoja y el navigate.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = fileURLToPath(new URL('../../../src', import.meta.url))

const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const readSource = (relative: string) =>
  stripComments(readFileSync(path.join(SRC, relative), 'utf8'))

describe('F136.7 — salir sin guardar descarta la sesión', () => {
  it('confirmLeaveConfirm resetea el store antes de navegar al home', () => {
    const hook = readSource('hooks/useActiveSession.ts')
    expect(hook).toMatch(
      /confirmLeaveConfirm:\s*\(\)\s*=>\s*\{[\s\S]*?useActiveWorkoutStore\.getState\(\)\.reset\(\)[\s\S]*?navigate\('\/'\)/,
    )
  })
})
