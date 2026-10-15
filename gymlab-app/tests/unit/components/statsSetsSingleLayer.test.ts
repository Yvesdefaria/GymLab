/// <reference types="node" />
// F91 · L3a — /estadisticas no declara lecturas propias de workoutSets: la página
// (EntrenoTab) y su tab de periodización consumen las series completadas de la
// capa única (F103/T6), donde el scan ya corre una sola vez para toda la app.
// Invariante de FUENTE (vitest corre en node, sin jsdom): si alguien reintroduce
// la lectura propia de sets en esa ruta, este test lo caza. Mismo patrón que
// statsTabsLazy/f120w6Regression.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = fileURLToPath(new URL('../../../src', import.meta.url))

// Quita comentarios para auditar CÓDIGO: la prosa nombra los patrones.
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const readSource = (relative: string) =>
  stripComments(readFileSync(path.join(SRC, relative), 'utf8'))

describe('F91/L3a — series de /estadisticas desde la capa única', () => {
  it('EntrenoTab consume completedSets de la capa única (sin useWorkoutSets)', () => {
    const tab = readSource('components/stats/EntrenoTab.tsx')
    expect(tab).toContain('useAchievementsData')
    expect(tab).toContain('completedSets')
    expect(tab).not.toContain('useWorkoutSets')
    expect(tab).not.toContain('workoutSetRepo')
  })

  it('PeriodizationSection consume las series de la capa única (sin query propia de sets)', () => {
    const section = readSource('components/periodization/PeriodizationSection.tsx')
    expect(section).toContain('useAchievementsData')
    expect(section).toContain('completedSets')
    expect(section).not.toContain('workoutSetRepo')
  })
})
