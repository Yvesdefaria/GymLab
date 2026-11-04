/// <reference types="node" />
// F137 — el volumen muscular usa una ventana móvil (28 días por defecto) en fechas locales,
// sin reset de calendario. Invariante de FUENTE (vitest corre en node, sin jsdom): el bug
// original de F136.1 nacía de `getDay()` + `toISOString()`.
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

describe('F137 — ventana móvil de volumen muscular', () => {
  it('el hook arma la ventana con fechas locales y sin reset de calendario', () => {
    const hook = readSource('hooks/useMuscleVolume.ts')
    expect(hook).toContain('WINDOW_DAYS')
    expect(hook).toContain('addLocalDays')
    expect(hook).toContain('toLocalDateStr')
    expect(hook).not.toContain('toISOString')
    expect(hook).not.toContain('getDay')
  })

  it('el tab monta la sección nueva y no el conteo de días anterior', () => {
    const tab = readSource('components/stats/EntrenoTab.tsx')
    expect(tab).toContain('MuscleVolumeSection')
    expect(tab).not.toContain('countMuscleFrequency')
  })
})
