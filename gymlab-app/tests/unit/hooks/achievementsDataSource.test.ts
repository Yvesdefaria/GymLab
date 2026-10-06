/// <reference types="node" />
// Invariantes de la capa única de datos de logros (F103/T6). El fan-out de
// liveQueries —incluido el scan en streaming de workoutSets completados— debe
// vivir en UN solo módulo del que dependen el host global y /logros; si vuelve a
// aparecer un segundo scan, el costo por navegación regresa sin que la suite lo vea.
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = fileURLToPath(new URL('../../../src', import.meta.url))

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.(ts|tsx)$/.test(entry) ? [full] : []
  })

// Quita comentarios para auditar CÓDIGO: la prosa de los módulos cita el scan y
// los patrones prohibidos, y daría falsos positivos.
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const sourceFiles = walk(SRC)
const relative = (file: string) => path.relative(SRC, file).split(path.sep).join('/')
const readSource = (name: string) => stripComments(readFileSync(path.join(SRC, name), 'utf8'))

// Scan en streaming de F91 (completed no está indexado): patrón exacto.
const COMPLETED_SETS_SCAN = /toCollection\(\)\s*\.filter\(\s*\(s\)\s*=>\s*s\.completed\s*\)/
const PROVIDER = 'hooks/useAchievementsData.tsx'

describe('capa única de datos de logros', () => {
  it('declara el scan de series completadas y la derivación en un solo módulo', () => {
    const owners = sourceFiles.filter((file) => COMPLETED_SETS_SCAN.test(readSource(relative(file)))).map(relative)

    expect(owners).toEqual([PROVIDER])

    const provider = readSource(PROVIDER)
    expect(provider).toContain('deriveAchievementStats')
    expect(provider).toContain('progressForAll')
  })

  it('el host global consume la capa única y conserva el debounce de 600 ms', () => {
    const hook = readSource('hooks/useAchievements.ts')

    expect(hook).toContain("from './useAchievementsData'")
    expect(hook).not.toMatch(/useLiveQuery/)
    expect(hook).not.toMatch(/@\/data\/repositories\/dexie\/db/)
    expect(hook).toContain('EVALUATION_DEBOUNCE_MS = 600')
    // La reconciliación sigue siendo dueña de las escrituras meta solo-si-cambió.
    expect(hook).toContain('achievementStatePatch')
    expect(hook).toContain('metaRepo.setJson')
  })

  it('/logros consume la capa única sin declarar consultas propias', () => {
    const route = readSource('pages/AchievementsRoute.tsx')
    expect(route).not.toMatch(/useLiveQuery|metaRepo|toCollection/)
    expect(route).toContain('useAchievementProgress')

    const hook = readSource('hooks/useAchievementProgress.ts')
    expect(hook).not.toMatch(/useLiveQuery|@\/data\/repositories\/dexie\/db|toCollection/)
    expect(hook).toContain('useAchievementsData')
  })

  it('AppShell monta el proveedor de datos una sola vez', () => {
    const shell = readSource('components/layout/AppShell.tsx')

    expect(shell).toMatch(
      /import\s*\{[^}]*AchievementsDataProvider[^}]*\}\s*from\s*['"]@\/hooks\/useAchievementsData['"]/,
    )
    expect(shell.match(/<AchievementsDataProvider/g) ?? []).toHaveLength(1)
  })

  it('perfil y pasos dejan de duplicar la lectura de meta de logros', () => {
    const perfil = readSource('pages/PerfilPage.tsx')
    expect(perfil).not.toMatch(/UNLOCKED_ACHIEVEMENTS_KEY|ACHIEVEMENT_COUNTS_KEY|COLLECTIBLES_KEY/)
    expect(perfil).toContain('useAchievementsData')

    const steps = readSource('pages/StepsPage.tsx')
    expect(steps).not.toMatch(/UNLOCKED_ACHIEVEMENTS_KEY/)
    expect(steps).toContain('useAchievementsData')
  })
})
