/// <reference types="node" />
// F120/W4 — invariantes de los fixes del lote planificador/onboarding (PLAN-1,
// PLAN-2, ONB-1, ONB-2). Mismo patrón que f120w2Regression / f120w3Regression: el
// entorno de vitest es node (sin jsdom), así que se auditan los módulos FUENTE. Si
// un arreglo se revierte (fan-out por rutina, equipamiento reconstruido por rutina,
// wizard suscrito estando oculto o lógica duplicada en dos consumidores), lo caza.
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

const CONSUMERS = ['pages/PlanificadorPage.tsx', 'components/onboarding/OnboardingWizard.tsx']

describe('F120/W4 — planificador y onboarding', () => {
  it('PLAN-1: días e ítems se leen en lote (getAllDays/getAllItems), sin fan-out por rutina', () => {
    const repo = readSource('data/repositories/dexie/routineRepo.ts')
    expect(repo).toContain('getAllDays')
    expect(repo).toContain('getAllItems')

    const types = readSource('data/repositories/types.ts')
    expect(types).toContain('getAllDays()')
    expect(types).toContain('getAllItems()')

    const hook = readSource('hooks/useRoutinePlan.ts')
    expect(hook).toContain('routineRepo.getAllDays()')
    expect(hook).toContain('routineRepo.getAllItems()')
    expect(hook).not.toMatch(/routineRepo\.getDays|routineRepo\.getItems/)

    for (const rel of CONSUMERS) {
      const source = readSource(rel)
      expect(source).not.toMatch(/routineRepo\.getDays|routineRepo\.getItems/)
      expect(source).not.toMatch(/Promise\.all\(routines\.map/)
    }
  })

  it('PLAN-2: el equipamiento exigido se resuelve en una pasada y el mapa se memoiza en el hook', () => {
    const domain = readSource('domain/routineResolution.ts')
    expect(domain).toContain('requiredEquipmentByRoutine')

    const hook = readSource('hooks/useRoutinePlan.ts')
    expect(hook).toMatch(/requiredEquipmentByRoutine\(routineData\.days/)
    expect(hook).toMatch(/useMemo\(/)
    expect(hook).not.toMatch(/requiredEquipmentOf\(/)

    // Los consumidores no rearman el mapa por rutina ni llaman al dominio directo.
    for (const rel of CONSUMERS) {
      const source = readSource(rel)
      expect(source).not.toMatch(/requiredEquipmentOf|requiredEquipmentByRoutine/)
    }
  })

  it('ONB-1: el gate liviano no monta ni suscribe el wizard si el onboarding ya está hecho', () => {
    const gate = readSource('components/onboarding/Onboarding.tsx')
    expect(gate).toContain('useOnboardingStatus')
    expect(gate).toMatch(/done === undefined \|\| done \|\| workoutCount > 0/)
    expect(gate).toContain('OnboardingWizard')
    // Los hooks pesados viven en el wizard: el gate solo corre las lecturas baratas del status.
    for (const heavy of ['useRoutines', 'useExerciseCatalog', 'useRoutineSlugs', 'useSettings', 'usePlanNaming']) {
      expect(gate).not.toContain(heavy)
    }

    const wizard = readSource('components/onboarding/OnboardingWizard.tsx')
    expect(wizard).toContain('useRoutinePlan')
    expect(wizard).not.toMatch(/useRoutineSlugs/)
  })

  it('ONB-2: planificador y onboarding comparten useRoutinePlan y no duplican el armado del plan', () => {
    const hook = readSource('hooks/useRoutinePlan.ts')
    expect(hook).toMatch(/planRoutine\(/)

    for (const rel of CONSUMERS) {
      const source = readSource(rel)
      expect(source).toMatch(/useRoutinePlan\(/)
      expect(source).not.toMatch(/planRoutine\(/)
      expect(source).not.toMatch(/requiredEquipment/)
      expect(source).not.toMatch(/Promise\.all/)
    }
  })
})
