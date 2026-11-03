/// <reference types="node" />
// F136.5 — el índice sticky no debe duplicar la cabecera real de la sección.
// Invariante de FUENTE: el predicado vive en domain y la página lo consume.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = fileURLToPath(new URL('../../../src', import.meta.url))

const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const readSource = (relative: string) =>
  stripComments(readFileSync(path.join(SRC, relative), 'utf8'))

describe('F136.5 — índice sticky sin duplicado', () => {
  it('la página consulta el predicado y oculta el índice mientras la cabecera está a la vista', () => {
    const page = readSource('pages/EjerciciosPage.tsx')
    expect(page).toContain('shouldShowStickyIndex')
    expect(page).toContain('stickyVisible')
    expect(page).toContain('opacity-0')
  })
})
