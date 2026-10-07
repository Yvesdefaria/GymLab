/// <reference types="node" />
// F120/W3 — invariantes de los 7 fixes de la re-auditoría F91 (A1, A2, A4, P2, P3,
// H1, H2). Mismo patrón que f120DataSharing / f120w2Regression: el entorno de
// vitest es node (sin jsdom), así que se auditan los módulos FUENTE. Si un
// arreglo se revierte (sort del delta PR, firma sin memo, memo monolítico,
// chart/heatmap sin memo, backfill por día o checks de salud por tick), lo caza.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = fileURLToPath(new URL('../../../src', import.meta.url))

// Quita comentarios para auditar CÓDIGO: la prosa nombra los patrones y daría
// falsos positivos.
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const readSource = (relative: string) =>
  stripComments(readFileSync(path.join(SRC, relative), 'utf8'))

describe('F120/W3 — regresiones de la re-auditoría', () => {
  it('A1: el conteo histórico de retos corta en el tope del único consumidor', () => {
    const challenges = readSource('domain/challenges.ts')
    expect(challenges).toMatch(/limit = Number\.POSITIVE_INFINITY/)
    expect(challenges).toMatch(/done\.size >= limit/)

    const progress = readSource('domain/achievementProgress.ts')
    expect(progress).toMatch(/COMPLETED_CHALLENGE_COUNT_LIMIT = 1/)
    expect(progress).toMatch(/COMPLETED_CHALLENGE_COUNT_LIMIT,/)
  })

  it('A2: maxPrDeltaKg resuelve base y pico en una pasada, sin sort por ejercicio', () => {
    const progress = readSource('domain/achievementProgress.ts')
    const start = progress.indexOf('let maxPrDeltaKg')
    const end = progress.indexOf('let daysSinceFirstWorkout')
    expect(start).toBeGreaterThan(-1)
    expect(end).toBeGreaterThan(start)
    const block = progress.slice(start, end)
    expect(block).not.toContain('.sort(')
    expect(block).not.toMatch(/const workingSets/)
    expect(block).toMatch(/for \(const set of completedSets\)/)
  })

  it('A4: la firma de cambios de useAchievements se memoiza', () => {
    const hook = readSource('hooks/useAchievements.ts')
    expect(hook).toMatch(/const signature = useMemo\(/)
    // Los digests O(n) no pueden volver a construirse en cada render del host.
    expect(hook).toMatch(/stepDaysDigest\(stepDays\)/)
  })

  it('P2: el proveedor separa el bag core del de pasos y los combina al final', () => {
    const provider = readSource('hooks/useAchievementsData.tsx')
    const coreStart = provider.indexOf('const coreStats = useMemo(')
    const stepStart = provider.indexOf('const stepStats = useMemo(')
    const statsStart = provider.indexOf('const stats = useMemo')
    expect(coreStart).toBeGreaterThan(-1)
    expect(stepStart).toBeGreaterThan(coreStart)
    expect(statsStart).toBeGreaterThan(stepStart)

    // El memo core no puede depender del histórico de pasos (esa es la mejora:
    // una escritura de dailySteps no re-deriva entrenos/comidas/cuerpo/fotos).
    const coreBlock = provider.slice(coreStart, stepStart)
    expect(coreBlock).toContain('deriveAchievementStatsCore')
    expect(coreBlock).not.toContain('stepDays')

    const stepBlock = provider.slice(stepStart, statsStart)
    expect(stepBlock).toContain('deriveAchievementStatsSteps')
    expect(stepBlock).toContain('stepDays')

    const statsBlock = provider.slice(statsStart, provider.indexOf('const progress = useMemo('))
    expect(statsBlock).toContain('...coreStats')
    expect(statsBlock).toContain('...stepStats')
  })

  it('P3: el chart y el heatmap de /pasos están memoizados con sus derivaciones', () => {
    const chart = readSource('components/steps/StepWeekChart.tsx')
    expect(chart).toMatch(/export const StepWeekChart = memo\(function StepWeekChart/)
    expect(chart).toMatch(/useMemo\(\s*\(\) => buildWeekSeries/)

    const heatmap = readSource('components/steps/StepHeatmap.tsx')
    expect(heatmap).toMatch(/export const StepHeatmap = memo\(function StepHeatmap/)
    expect(heatmap).toMatch(/useMemo\(\s*\(\) => buildHeatmapGrid/)
  })

  it('H1: el backfill lee el rango una vez y escribe en un solo bulk', () => {
    const sync = readSource('data/stepsSync.ts')
    expect(sync).toContain('stepRepo.getRange(')
    expect(sync).toContain('stepRepo.bulkUpsert(')
    // Sin doble lectura ni transacción por día.
    expect(sync).not.toMatch(/stepRepo\.getByDate|stepRepo\.upsert/)

    const repo = readSource('data/repositories/dexie/stepRepo.ts')
    expect(repo).toContain('bulkUpsert')
    expect(repo).toContain('bulkPut')
  })

  it('H2: la sesión cachea availability/permiso/zancada y el foreground la invalida', () => {
    const sync = readSource('data/stepsSync.ts')
    expect(sync).toContain('resetHealthSyncSessionCaches')
    expect(sync).toMatch(/let sessionAvailable/)
    expect(sync).toMatch(/let sessionPermission/)
    expect(sync).toMatch(/let sessionStrideLengthCm/)

    const host = readSource('hooks/useHealthSyncHost.ts')
    expect(host).toMatch(/resetHealthSyncSessionCaches\(\)/)
  })
})
