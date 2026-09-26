// Render estático de los componentes del resultado del planificador (dirección A).
// Se importa `@/i18n` para que `t()` resuelva las claves reales (mismo patrón que
// tests/unit/domain/achievementMedal.test.ts: componentes con i18n, sin DOM).
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import '@/i18n'
import { PlanDayCard } from '@/components/routines/PlanDayCard'
import { PlanPreview } from '@/components/routines/PlanPreview'
import { PlanCoverageNote } from '@/components/routines/PlanCoverageNote'
import type { RoutinePlan } from '@/domain/routineResolution'

describe('PlanDayCard (dirección A)', () => {
  it('muestra nombre, músculos, pill de minutos y filas series×reps', () => {
    const html = renderToStaticMarkup(
      <PlanDayCard name="Día 1" muscles={['Pecho', 'Hombro']} estimatedMinutes={58}
        items={[{ exerciseId: 1, name: 'Press de pecho con barra', targetSets: 4, targetReps: 8 }]} />,
    )
    expect(html).toContain('Día 1')
    expect(html).toContain('Pecho')
    expect(html).toContain('≈ 58 min')
    expect(html).toContain('Press de pecho con barra')
    expect(html).toContain('4')
    expect(html).toContain('8')
  })

  it('sin músculos no pinta el separador y conserva la pill de minutos', () => {
    const html = renderToStaticMarkup(
      <PlanDayCard name="Día 1" muscles={[]} estimatedMinutes={45} items={[]} />,
    )
    expect(html).toContain('≈ 45 min')
    expect(html).not.toContain('·')
  })
})

describe('PlanPreview', () => {
  it('deriva los músculos de los ítems y resuelve nombre/grupo con las closures', () => {
    const plan: RoutinePlan = {
      source: 'generated',
      title: 'Plan Volumen · 4 días',
      objective: 'volumen',
      level: 'principiante',
      daysPerWeek: 4,
      days: [
        {
          dayNumber: 1,
          name: 'Día 1',
          estimatedMinutes: 45,
          items: [
            { exerciseId: 1, targetSets: 4, targetReps: 8, restSec: 90 },
            { exerciseId: 2, targetSets: 3, targetReps: 10, restSec: 60 },
          ],
        },
      ],
      coverage: { omittedGroups: [], droppedDays: [] },
    }
    const html = renderToStaticMarkup(
      <PlanPreview
        plan={plan}
        exerciseName={(id) => (id === 1 ? 'Press de pecho' : 'Remo con barra')}
        exerciseGroup={(id) => (id === 1 ? 'pecho' : 'espalda')}
        muscleLabel={(group) => (group === 'pecho' ? 'Pecho' : 'Espalda')}
      />,
    )
    expect(html).toContain('Día 1')
    expect(html).toContain('Pecho')
    expect(html).toContain('Espalda')
    expect(html).toContain('Press de pecho')
    expect(html).toContain('Remo con barra')
    expect(html).toContain('≈ 45 min')
  })
})

describe('PlanCoverageNote', () => {
  it('avisa de grupos omitidos y días caídos como status accesible', () => {
    const html = renderToStaticMarkup(<PlanCoverageNote omittedGroups={['Pecho']} droppedDays={[3]} />)
    expect(html).toContain('role="status"')
    expect(html).toContain('Pecho')
    expect(html).toContain('3')
  })

  it('no renderiza nada si no hay cobertura que reportar', () => {
    expect(renderToStaticMarkup(<PlanCoverageNote omittedGroups={[]} droppedDays={[]} />)).toBe('')
  })
})
