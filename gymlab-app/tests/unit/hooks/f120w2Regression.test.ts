/// <reference types="node" />
// F120/W2 — invariantes de los 7 fixes de la re-auditoría F91 (A3, S1, S2, CAR-2,
// PLAN-3, T1, T2). Mismo patrón que f120DataSharing / homeDataSharing: el entorno
// de vitest es node (sin jsdom), así que se auditan los módulos FUENTE. Si un
// arreglo se revierte (cleanup del pulse, lecturas duplicadas, suscripciones
// extra, scroll sin throttle), este test lo caza.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = fileURLToPath(new URL('../../../src', import.meta.url))

// Quita comentarios para auditar CÓDIGO: la prosa nombra las queries y daría falsos positivos.
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const readSource = (relative: string) =>
  stripComments(readFileSync(path.join(SRC, relative), 'utf8'))

const countOf = (source: string, pattern: RegExp): number =>
  source.match(pattern)?.length ?? 0

describe('F120/W2 — regresiones de la re-auditoría', () => {
  it('A3: el pulse de anime.js del modal de logros se pausa al desmontar (cleanup)', () => {
    const modal = readSource('components/achievements/AchievementModal.tsx')
    // El efecto de celebración debe retornar un cleanup que pausa la instancia vigente:
    // sin él, el `loop: true` sigue corriendo contra un nodo desconectado.
    expect(modal).toMatch(/return \(\) => \{\s*pulseRef\.current\?\.pause\(\)/)
  })

  it('S1/S2: el detalle no duplica useWorkout y la foto lee PRs por ventana', () => {
    const hook = readSource('hooks/useSessionPhotoData.ts')
    // El hook recibe workout/sets del consumidor y no declara su propio useWorkout.
    expect(hook).not.toMatch(/useWorkout/)
    expect(hook).not.toMatch(/prRepo\.getAll/)
    expect(hook).toMatch(/getInWindow/)
    expect(hook).toMatch(/countPrsInWorkout\(workout, prsInWindow\)/)

    const detail = readSource('components/workout/WorkoutDetail.tsx')
    expect(countOf(detail, /useWorkout\(/g)).toBe(1)
    expect(detail).toMatch(/useSessionPhotoData\(workout, sets\)/)

    const summary = readSource('components/workout/SessionSummaryView.tsx')
    expect(summary).toMatch(/useWorkout\(workoutId\)/)
    expect(summary).toMatch(/useSessionPhotoData\(workout, sets, prCount\)/)

    const repo = readSource('data/repositories/dexie/prRepo.ts')
    expect(repo).toMatch(/getInWindow/)
    const db = readSource('data/repositories/dexie/db.ts')
    expect(db).toMatch(/prs: 'exerciseId, date'/)
  })

  it('CAR-2: los bloques reciben los ajustes por props y no corren su propio useSettings', () => {
    const hook = readSource('hooks/useLoadSuggestion.ts')
    expect(hook).not.toMatch(/useSettings/)
    expect(hook).toMatch(/showLoadSuggestion: boolean/)
    expect(hook).toMatch(/progressionPct: number/)

    const session = readSource('hooks/useActiveSession.ts')
    expect(session).toMatch(/showLoadSuggestion: settings\.showLoadSuggestion/)
    expect(session).toMatch(/loadProgressionPct: settings\.loadProgressionPct/)

    const carousel = readSource('components/workout/SessionCarousel.tsx')
    expect(carousel).toMatch(/showLoadSuggestion/)
    expect(carousel).toMatch(/loadProgressionPct/)

    const block = readSource('components/workout/ExerciseBlock.tsx')
    expect(block).not.toMatch(/useSettings/)
    expect(block).toMatch(/showLoadSuggestion/)
    expect(block).toMatch(/loadProgressionPct/)

    const page = readSource('pages/EntrenamientoPage.tsx')
    expect(page).toMatch(
      /<SessionCarousel[\s\S]*?showLoadSuggestion=\{showLoadSuggestion\}[\s\S]*?loadProgressionPct=\{loadProgressionPct\}/
    )
  })

  it('PLAN-3: el planificador deriva los slugs de la misma lista de rutinas', () => {
    const page = readSource('pages/PlanificadorPage.tsx')
    expect(page).not.toMatch(/useRoutineSlugs/)
    expect(page).toMatch(/routines\.map\(\(r\) => r\.slug\)/)
  })

  it('T1: el scroll del tour pasa por rAF y no re-renderiza con rect idéntico', () => {
    const anchor = readSource('components/tour/useTourAnchor.ts')
    expect(anchor).not.toMatch(/addEventListener\('scroll', measure/)
    expect(anchor).toMatch(/addEventListener\('scroll', scheduleMeasure, true\)/)
    expect(anchor).toMatch(/addEventListener\('resize', scheduleMeasure\)/)
    // Bailout: la geometría repetida no vuelve a setear estado.
    expect(anchor).toContain('lastRect')
  })

  it('T2: las metas del tour se comparten en un hook único y los tips ya vistos no hacen roundtrip', () => {
    const meta = readSource('hooks/useTourMeta.ts')
    expect(meta).toContain('useLiveQuery')
    expect(meta).toContain('SECTION_TIPS_SEEN_META_KEY')

    const tip = readSource('components/tour/SectionTipHost.tsx')
    expect(tip).not.toMatch(/useMetaValue/)
    expect(tip).toContain('useTourMeta')
    // Gate reactivo antes del getJson: una sección ya vista no vuelve a leer `meta`.
    expect(tip).toMatch(/if \(tipsSeen\[section\]\) return/)

    const host = readSource('components/tour/TourHost.tsx')
    expect(host).not.toMatch(/useMetaValue/)
    expect(host).toContain('useTourMeta')
  })
})
