/// <reference types="node" />
// F136.1 — la frecuencia muscular usa una ventana móvil de 7 días en fechas locales.
// Invariante de FUENTE (vitest corre en node, sin jsdom): el bug original nacía de
// `getDay()` + `toISOString()` en EntrenoTab. Mismo patrón que statsSetsSingleLayer.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = fileURLToPath(new URL('../../../src', import.meta.url))

// Quita comentarios para auditar CÓDIGO: la prosa puede nombrar los patrones.
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const readSource = (relative: string) =>
  stripComments(readFileSync(path.join(SRC, relative), 'utf8'))

describe('F136.1 — ventana móvil de frecuencia muscular', () => {
  it('EntrenoTab arma la ventana con fechas locales y el conteo de dominio', () => {
    const tab = readSource('components/stats/EntrenoTab.tsx')
    expect(tab).toContain('countMuscleFrequency')
    expect(tab).toContain('addLocalDays')
    expect(tab).toContain('toLocalDateStr')
    expect(tab).not.toContain('toISOString')
    expect(tab).not.toContain('getDay')
  })
})
