/// <reference types="node" />
// F120/W6 — invariantes de los advisories de código del lote final. El entorno
// de vitest es node (sin jsdom), así que se auditan los módulos FUENTE: si un
// arreglo se revierte, lo caza.
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

describe('F120/W6 — advisories de código', () => {
  it('R3-stale-now: el host recomputa daysSinceFirstWorkout con now fresco al evaluar', () => {
    const hook = readSource('hooks/useAchievements.ts')
    // La evaluación no puede consumir el stats memoizado con el `now` congelado:
    // inyecta el reloj actual al llamar a checkAchievements.
    expect(hook).toContain('checkAchievements({')
    expect(hook).toMatch(/daysSinceFirstWorkout\(workouts, new Date\(\)\)/)
    expect(hook).not.toMatch(/checkAchievements\(stats\)/)
  })

  it('R3-ready-gate: el gate del proveedor espera exercises y guides', () => {
    const provider = readSource('hooks/useAchievementsData.tsx')
    expect(provider).toContain('const [exercises, exercisesReady]')
    expect(provider).toContain('const [guides, guidesReady]')

    const ready = provider.match(/const ready =([\s\S]*?)\n\n/)?.[1] ?? ''
    expect(ready).toContain('exercisesReady')
    expect(ready).toContain('guidesReady')
  })

  it('R3-lazy-tab-failure-path: el tab activo vive en un boundary local con reintento', () => {
    const page = readSource('pages/EstadisticasPage.tsx')
    expect(page).toContain('TabErrorBoundary')
    expect(page).toMatch(/<TabErrorBoundary key=\{tab\}/)
    expect(page).toMatch(/onRetry=\{\(\) => window\.location\.reload\(\)\}/)

    const boundary = readSource('components/stats/TabErrorBoundary.tsx')
    expect(boundary).toMatch(/getDerivedStateFromError/)
    expect(boundary).toContain('TabFailure')
  })

  it('R3-001/T3: el reseed retry re-ejecuta el arranque mínimo pendiente', () => {
    const store = readSource('app/seedingStore.ts')
    expect(store).toContain('minimalBootApplied')
    expect(store).toMatch(/if \(!minimalBootApplied\) await minimalBoot\(\)/)
  })

  it('R3-002/T3: el fallback embebido del catálogo no rechaza sin manejo', () => {
    const loader = readSource('data/catalogLoader.ts')
    expect(loader).toMatch(/try \{[\s\S]*loadEmbeddedCatalog\(\)[\s\S]*\} catch/)
  })

  it('R3-002/T7: el registro del SW en web no queda como promesa rechazada', () => {
    const sw = readSource('lib/serviceWorker.ts')
    expect(sw).toMatch(/try \{[\s\S]*loadRegister\(\)[\s\S]*\} catch/)
  })

  it('R3-001/H1: bulkUpsert dedupea por localDate antes de asignar ids', () => {
    const repo = readSource('data/repositories/dexie/stepRepo.ts')
    expect(repo).toMatch(/const byDate = new Map/)
    expect(repo).toMatch(/byDate\.set\(entry\.localDate, entry\)/)
    expect(repo).toMatch(/\[\.\.\.byDate\.values\(\)\]/)
  })

  it('R3-001/W5: slidePropsEqual itera la unión de claves de prev y next', () => {
    const slide = readSource('components/workout/SessionCarouselSlide.tsx')
    expect(slide).toMatch(/new Set<keyof SessionCarouselSlideProps>\(\[/)
    expect(slide).toMatch(/Object\.keys\(prev\)/)
    expect(slide).toMatch(/Object\.keys\(next\)/)
  })

  it('R3-001/T5: el test del tick usa fake timers completos (captura el setTimeout)', () => {
    const test = stripComments(
      readFileSync(
        path.join(SRC, '..', 'tests', 'unit', 'store', 'activeWorkoutStore.test.ts'),
        'utf8',
      ),
    )
    expect(test).toContain("'setTimeout', 'clearTimeout'")
  })
})
