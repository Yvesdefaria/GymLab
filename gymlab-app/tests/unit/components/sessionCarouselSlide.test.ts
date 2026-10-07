// Comparador de memo del slide del carrusel (F120/CAR-1): teclear una serie no debe
// re-renderizar los slides ajenos. `groupExercises` reconstruye los grupos en cada
// render, así que el comparador mira las IDENTIDADES internas (el store conserva la
// referencia de los ejercicios no tocados) y las entradas de sugerencia (el Map se
// recrea por tecla, pero `useBlockSuggestions` estabiliza cada valor).
import { describe, expect, it } from 'vitest'
import {
  slidePropsEqual,
  type SessionCarouselSlideProps,
} from '@/components/workout/SessionCarouselSlide'
import type { ExerciseGroup } from '@/domain/sessionGroups'
import type { SessionSuggestion } from '@/domain/sessionSuggestions'
import type { ActiveExercise, ActiveSet } from '@/store/activeWorkoutStore'

const set = (id: string, completed: boolean): ActiveSet => ({
  id,
  exerciseId: 1,
  exerciseName: 'Fake',
  setNumber: 1,
  weightKg: 60,
  reps: 10,
  completed,
})

const ex = (exerciseId: number, sets: ActiveSet[]): ActiveExercise => ({
  exerciseId,
  exerciseName: `Ex${exerciseId}`,
  sets,
})

const group = (exercises: ActiveExercise[]): ExerciseGroup<ActiveExercise> => ({
  key: `solo-${exercises[0]!.exerciseId}`,
  label: null,
  exercises,
})

// Props compartidas ESTABLES: en el render real llegan memoizadas de useActiveSession
// (mismas referencias entre teclas); el comparador debe poder bailar con ellas.
const sharedProps = {
  prMap: new Map() as SessionCarouselSlideProps['prMap'],
  categoryFor: () => undefined,
  slugFor: () => undefined,
  noteFor: () => undefined,
  registerSlide: () => {},
  onSuggestionApply: () => {},
  onSuggestionWarmup: () => {},
  onCompleteExercise: () => {},
  onSetCompleted: () => {},
  onRemoveRequest: () => {},
  onSetRemoveRequest: () => {},
}

const props = (
  overrides: Partial<SessionCarouselSlideProps> = {}
): SessionCarouselSlideProps => ({
  group: group([ex(1, [set('a', false)])]),
  index: 0,
  groupCount: 2,
  showRpe: false,
  showRir: false,
  showLoadSuggestion: true,
  loadProgressionPct: 2.5,
  units: 'kg',
  ...sharedProps,
  ...overrides,
})

const suggestion = (messageKey: string): SessionSuggestion => ({
  id: 'sug-1',
  type: 'increase',
  exerciseId: 1,
  messageKey,
  priority: 'medium',
})

describe('slidePropsEqual (F120/CAR-1)', () => {
  it('baila el render cuando el grupo se reconstruye con las mismas identidades internas', () => {
    const shared = ex(1, [set('a', false)])
    const prev = props({ group: group([shared]) })
    const next = props({ group: group([shared]) })
    expect(slidePropsEqual(prev, next)).toBe(true)
  })

  it('re-renderiza cuando el ejercicio del grupo cambió (tecla sobre ese slide)', () => {
    const prev = props({ group: group([ex(1, [set('a', false)])]) })
    const next = props({ group: group([ex(1, [set('a', false)])]) })
    expect(slidePropsEqual(prev, next)).toBe(false)
  })

  it('compara las entradas de sugerencia, no la identidad del Map recreado', () => {
    const shared = ex(1, [set('a', false)])
    const stable = suggestion('suggestion.increase')
    const prev = props({ group: group([shared]), suggestions: new Map([[1, stable]]) })
    const next = props({ group: group([shared]), suggestions: new Map([[1, stable]]) })
    expect(slidePropsEqual(prev, next)).toBe(true)
  })

  it('re-renderiza cuando la sugerencia de este grupo cambia de contenido', () => {
    const shared = ex(1, [set('a', false)])
    const prev = props({
      group: group([shared]),
      suggestions: new Map([[1, suggestion('suggestion.increase')]]),
    })
    const next = props({
      group: group([shared]),
      suggestions: new Map([[1, suggestion('suggestion.decrease')]]),
    })
    expect(slidePropsEqual(prev, next)).toBe(false)
  })

  it('re-renderiza cuando una prop opcional aparece solo en next', () => {
    const shared = ex(1, [set('a', false)])
    const prev = props({ group: group([shared]) })
    const next = props({
      group: group([shared]),
      bodyWeight: { id: 1, localDate: '2026-10-01', weightKg: 80, createdAt: '2026-10-01T10:00:00.000Z' },
    })
    expect(slidePropsEqual(prev, next)).toBe(false)
  })

  it('re-renderiza cuando cambia el índice/cantidad de grupos (aria-labels)', () => {
    const shared = ex(1, [set('a', false)])
    const prev = props({ group: group([shared]), index: 0 })
    const next = props({ group: group([shared]), index: 1 })
    expect(slidePropsEqual(prev, next)).toBe(false)
  })
})
