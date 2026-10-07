/// <reference types="node" />
// F120/W1 — invariantes de la redirección de lecturas duplicadas hacia la capa
// única de datos (AchievementsDataProvider). Mismo patrón que homeDataSharing /
// achievementsDataSource: el entorno de vitest es node (sin jsdom), así que se
// auditan los módulos FUENTE. Si una página vuelve a declarar su propia lectura
// completa (o deriva de nuevo lo que el proveedor ya expone), este test lo caza.
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

describe('F120/W1 — consumidores leen de la capa única', () => {
  it('P1: useStepData recibe las entradas del proveedor y no corre su propio getAll', () => {
    const hook = readSource('hooks/useStepData.ts')
    expect(hook).not.toMatch(/stepRepo\.getAll\(/)
    expect(hook).toMatch(/useStepData = \(entries: DailyStepsEntry\[\]\)/)

    const page = readSource('pages/StepsPage.tsx')
    expect(page).toContain('useAchievementsData()')
    expect(page).toMatch(/useStepData\(stepDays\)/)
  })

  it('A5: PerfilPage deja de duplicar workouts/prs/racha vía hooks compartidos', () => {
    const page = readSource('pages/PerfilPage.tsx')
    // Antes: useWorkoutSummary (workouts+racha) + usePRs, ambos ya cubiertos por el proveedor.
    expect(page).not.toMatch(/useWorkoutSummary|usePRs/)
    expect(page).toContain('useAchievementsData')
    expect(page).toMatch(/workouts,\s*prs,\s*streak/)
  })

  it('PH-2: useProgressPhotos no declara lectura y las rutas renderizan fotos del proveedor', () => {
    const hook = readSource('hooks/useProgressPhotos.ts')
    expect(hook).not.toMatch(/useLiveQuery|getAll/)

    const route = readSource('pages/ProgressPhotosRoute.tsx')
    expect(route).toContain('useAchievementsData')
    const compare = readSource('pages/ProgressPhotosCompareRoute.tsx')
    expect(compare).toContain('useAchievementsData')
  })

  it('CB-1: CuerpoPage consume workouts/completedSets/muscle map del proveedor', () => {
    const page = readSource('pages/CuerpoPage.tsx')
    expect(page).not.toMatch(/useWorkouts\b|useWorkoutSets/)
    expect(page).toContain('useAchievementsData()')
    expect(page).toMatch(/lastTrainedByMuscle\(workouts, completedSets, exerciseMuscles\)/)
    // El dominio acepta el mapa id→músculo (sin reconstruir un Map desde el catálogo).
    expect(readSource('domain/muscleFatigue.ts')).toContain('ReadonlyMap<number, MuscleGroup>')
  })

  it('OB-1: un solo catálogo y la proyección se alimenta de completedSets', () => {
    const page = readSource('pages/ObjetivosPage.tsx')
    expect(countOf(page, /useExerciseCatalog\(/g)).toBe(1)
    expect(page).toContain('useAchievementsData')
    expect(page).toMatch(/sets=\{completedSets\}/)
    expect(page).toMatch(/exercises=\{exercises\}/)

    const setter = readSource('components/goals/GoalSetter.tsx')
    expect(setter).not.toMatch(/useExerciseCatalog/)
    expect(setter).toContain('exercises: Exercise[]')

    const card = readSource('components/home/GoalProjectionCard.tsx')
    expect(card).not.toMatch(/useWorkoutSets|useExerciseCatalog|GoalProjectionCardSelf/)
  })

  it('PC-2: PesoCorporalPage lee bodyWeights del proveedor y usa el hook solo para mutar', () => {
    const page = readSource('pages/PesoCorporalPage.tsx')
    expect(page).not.toMatch(/useBodyWeight\(\)/)
    expect(page).toContain('useBodyWeightMutations')
    expect(page).toContain('useAchievementsData')
    expect(page).toContain('bodyWeights')
  })

  it('N1: DataHosts vive dentro del proveedor y notificaciones consume su workouts/streak', () => {
    const shell = readSource('components/layout/AppShell.tsx')
    const open = shell.indexOf('<AchievementsDataProvider')
    const close = shell.indexOf('</AchievementsDataProvider>')
    const hosts = shell.indexOf('<DataHosts')
    expect(open).toBeGreaterThan(-1)
    expect(close).toBeGreaterThan(open)
    expect(hosts).toBeGreaterThan(open)
    expect(hosts).toBeLessThan(close)

    const hook = readSource('hooks/useNotifications.ts')
    expect(hook).not.toMatch(/workoutRepo/)
    expect(hook).not.toMatch(/useStreak|calcStreak\(/)
    expect(hook).toContain("from './useAchievementsData'")
    expect(hook).toContain('useAchievementsData()')
  })

  it('H3: useOnboardingStatus usa un conteo liviano sin routines y el wizard pide routines aparte', () => {
    const status = readSource('hooks/useOnboardingStatus.ts')
    expect(status).not.toMatch(/routineRepo|getAll\(/)
    expect(status).toContain('workoutRepo.count()')

    const host = readSource('hooks/useHealthSyncHost.ts')
    expect(host).toMatch(/shouldRunStartupSync\(done, workoutCount\)/)

    const gate = readSource('components/onboarding/Onboarding.tsx')
    expect(gate).not.toMatch(/\bworkouts\b/)
    expect(gate).toContain('workoutCount')
    // W4/ONB-1: el gate ya no monta el cuerpo pesado; el catálogo completo de rutinas
    // lo sigue leyendo el wizard (vía useRoutinePlan), separado del status liviano.
    expect(gate).not.toContain('useRoutines')
    const wizard = readSource('components/onboarding/OnboardingWizard.tsx')
    expect(wizard).not.toMatch(/\bworkouts\b/)
    expect(wizard).toContain('useRoutinePlan')
    expect(readSource('hooks/useRoutinePlan.ts')).toContain('useRoutines')
  })
})
