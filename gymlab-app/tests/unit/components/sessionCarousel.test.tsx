// Render estático del carrusel de la sesión: slides montados (sin virtualización), agrupación
// de superserie y aria-labels. El scroll y el auto-avance se cubren en los e2e (aquí no hay DOM).
// (El warning de React sobre useLayoutEffect en SSR es esperado: renderToStaticMarkup no
// ejecuta effects; no afecta el resultado del test.)
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import '@/i18n'
import { SessionCarousel } from '@/components/workout/SessionCarousel'
import { groupExercises, uniqueGroupKeys } from '@/domain/sessionGroups'
import type { ActiveExercise, ActiveSet } from '@/store/activeWorkoutStore'
import type { PRRecord } from '@/domain/types'

const set = (id: string, completed: boolean): ActiveSet => ({
  id,
  exerciseId: 1,
  exerciseName: 'Fake',
  setNumber: 1,
  weightKg: 60,
  reps: 10,
  completed,
})

const ex = (
  exerciseId: number,
  exerciseName: string,
  supersetGroup: string | undefined,
  sets: ActiveSet[]
): ActiveExercise => ({ exerciseId, exerciseName, supersetGroup, sets })

const renderCarousel = (exercises: ActiveExercise[]) =>
  renderToStaticMarkup(
    <SessionCarousel
      exercises={exercises}
      prMap={new Map<number, PRRecord>()}
      showRpe={false}
      showRir={false}
      showLoadSuggestion={true}
      loadProgressionPct={2.5}
      units="kg"
      categoryFor={() => 'strength'}
      slugFor={() => undefined}
      noteFor={() => undefined}
      onSuggestionApply={() => {}}
      onSuggestionWarmup={() => {}}
      onCompleteExercise={() => {}}
      onSetCompleted={() => {}}
      onRemoveRequest={() => {}}
      onSetRemoveRequest={() => {}}
    />
  )

describe('SessionCarousel', () => {
  it('monta un slide por grupo y el contador «N de M»', () => {
    const html = renderCarousel([
      ex(1, 'Press de banca', undefined, [set('s1', false)]),
      ex(2, 'Remo con barra', undefined, [set('s2', false)]),
    ])
    expect(html).toContain('Press de banca')
    expect(html).toContain('Remo con barra')
    expect(html).toContain('1 de 2')
    expect(html).toContain('Ejercicio 1 de 2: Press de banca')
  })

  it('agrupa la superserie en UN slide con su badge y su aria-label', () => {
    const html = renderCarousel([
      ex(1, 'Press de banca', 'A', [set('s1', false)]),
      ex(2, 'Remo con barra', 'A', [set('s2', false)]),
      ex(3, 'Curl de bíceps', undefined, [set('s3', false)]),
    ])
    expect(html).toContain('Superserie A')
    expect(html).toContain('Superserie 1 de 2: Press de banca, Remo con barra')
    expect(html).toContain('Ejercicio 2 de 2: Curl de bíceps')
  })
})

// R3-001: `group.key` no es único cuando el mismo ejercicio suelto se repite en la sesión
// (misma clave `solo-<id>`); la identidad por grupo debe distinguir esas repeticiones.
describe('uniqueGroupKeys (R3-001)', () => {
  it('da identidades distintas a dos ejercicios sueltos idénticos consecutivos', () => {
    const groups = groupExercises([
      ex(5, 'Sentadilla', undefined, [set('s1', false)]),
      ex(5, 'Sentadilla', undefined, [set('s2', false)]),
    ])
    expect(groups).toHaveLength(2)
    const keys = uniqueGroupKeys(groups)
    expect(keys).toHaveLength(2)
    expect(new Set(keys).size).toBe(2)
  })

  it('conserva las claves originales y desambigua repeticiones separadas', () => {
    const groups = groupExercises([
      ex(1, 'Press de banca', 'A', [set('s1', false)]),
      ex(2, 'Remo con barra', undefined, [set('s2', false)]),
      ex(3, 'Curl de bíceps', 'A', [set('s3', false)]),
    ])
    expect(uniqueGroupKeys(groups)).toEqual(['A', 'solo-2', 'A#2'])
  })

  // El label de superserie es texto libre (ExerciseItem): una etiqueta literal «A#2» puede
  // chocar con el sufijo que desambigua a la segunda «A»; la identidad debe seguir siendo única.
  it('no colisiona con una etiqueta literal que ya usa el formato de sufijo', () => {
    const groups = groupExercises([
      ex(1, 'Press de banca', 'A', [set('s1', false)]),
      ex(2, 'Remo con barra', undefined, [set('s2', false)]),
      ex(3, 'Curl de bíceps', 'A', [set('s3', false)]),
      ex(4, 'Extensión de tríceps', 'A#2', [set('s4', false)]),
    ])
    const keys = uniqueGroupKeys(groups)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).toEqual(['A', 'solo-2', 'A#2', 'A#2#2'])
  })
})
