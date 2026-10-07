// Slide del carrusel de sesión (F120/CAR-1): un componente memoizado por grupo con
// comparador sobre IDENTIDADES, no sobre el objeto `group` (que groupExercises
// reconstruye en cada render). Teclear una serie conserva la referencia de los
// ejercicios no tocados, así que solo re-renderiza el slide afectado.
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCheck, Link2 } from 'lucide-react'
import { ExerciseBlock } from '@/components/workout/ExerciseBlock'
import { isGroupComplete, type ExerciseGroup } from '@/domain/sessionGroups'
import type { ActiveExercise } from '@/store/activeWorkoutStore'
import type { Units } from '@/domain/settings'
import type { PRRecord, BodyWeightEntry } from '@/domain/types'
import type { SessionSuggestion } from '@/domain/sessionSuggestions'

export interface SessionCarouselSlideProps {
  group: ExerciseGroup<ActiveExercise>
  index: number
  groupCount: number
  prMap: Map<number, PRRecord>
  showRpe: boolean
  showRir: boolean
  showLoadSuggestion: boolean
  loadProgressionPct: number
  units: Units
  categoryFor: (exerciseId: number) => string | undefined
  slugFor: (exerciseId: number) => string | undefined
  noteFor: (exerciseId: number) => string | undefined
  deloadActive?: boolean
  bodyWeight?: BodyWeightEntry
  loadAverages?: Map<number, number>
  suggestions?: Map<number, SessionSuggestion>
  registerSlide: (index: number, el: HTMLDivElement | null) => void
  onSuggestionApply: (exerciseId: number, amountKg: number) => void
  onSuggestionWarmup: (exerciseId: number, warmupWeightKg: number) => void
  onCompleteExercise: (exerciseId: number) => void
  onSetCompleted: (exerciseId: number, setId: string, completed: boolean) => void
  onRemoveRequest: (exerciseId: number) => void
  onSetRemoveRequest: (exerciseId: number, setId: string) => void
}

// Comparador de memo (F120/CAR-1). Claves del tecleo:
// - `group` se compara por identidad de sus ejercicios: el store devuelve el mismo
//   `ex` para los ejercicios no tocados (`updateSet` reemplaza solo el afectado).
// - `suggestions` se compara por entrada: useBlockSuggestions recrea el Map en cada
//   tecla pero estabiliza la referencia de cada sugerencia mientras no cambie.
// El resto de props (mapas/callbacks de useActiveSession) son estables entre teclas;
// si alguna cambia de identidad se re-renderiza (comportamiento seguro).
export const slidePropsEqual = (
  prev: SessionCarouselSlideProps,
  next: SessionCarouselSlideProps
): boolean => {
  if (prev.index !== next.index || prev.groupCount !== next.groupCount) return false
  if (prev.group.label !== next.group.label) return false
  const a = prev.group.exercises
  const b = next.group.exercises
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    const exercise = a[i]!
    if (exercise !== b[i]) return false
    if (prev.suggestions?.get(exercise.exerciseId) !== next.suggestions?.get(exercise.exerciseId)) {
      return false
    }
  }
  // R3-001 (F120/W5): se itera la UNIÓN de claves. Con solo las de `prev`, una
  // prop opcional que aparece únicamente en `next` (undefined → valor) no se veía
  // y el slide no re-renderizaba.
  const keys = new Set<keyof SessionCarouselSlideProps>([
    ...(Object.keys(prev) as (keyof SessionCarouselSlideProps)[]),
    ...(Object.keys(next) as (keyof SessionCarouselSlideProps)[]),
  ])
  for (const key of keys) {
    if (key === 'group' || key === 'index' || key === 'groupCount' || key === 'suggestions') continue
    if ((prev[key] as unknown) !== (next[key] as unknown)) return false
  }
  return true
}

export const SessionCarouselSlide = memo(({
  group,
  index,
  groupCount,
  registerSlide,
  prMap,
  showRpe,
  showRir,
  showLoadSuggestion,
  loadProgressionPct,
  units,
  categoryFor,
  slugFor,
  noteFor,
  deloadActive,
  bodyWeight,
  loadAverages,
  suggestions,
  onSuggestionApply,
  onSuggestionWarmup,
  onCompleteExercise,
  onSetCompleted,
  onRemoveRequest,
  onSetRemoveRequest,
}: SessionCarouselSlideProps) => {
  const { t } = useTranslation()
  const isSuper = group.label !== null
  const complete = isGroupComplete(group)

  return (
    <div
      ref={(el) => registerSlide(index, el)}
      role="group"
      aria-label={
        isSuper
          ? t('session.superserieDeGrupos', {
              actual: index + 1,
              total: groupCount,
              nombres: group.exercises.map((ex) => ex.exerciseName).join(', '),
            })
          : t('session.ejercicioDeGrupos', {
              actual: index + 1,
              total: groupCount,
              nombre: group.exercises[0]?.exerciseName ?? '',
            })
      }
      className={`w-[88%] shrink-0 snap-center ${
        isSuper
          ? `space-y-3 rounded-2xl border p-2 ${
              complete ? 'border-success/40 bg-success/5' : 'border-cta/40 bg-cta/5'
            }`
          : ''
      }`}
    >
      {isSuper && (
        <div className="flex items-center gap-2 px-2 pt-1">
          <Link2 className="size-4 shrink-0 text-cta" aria-hidden />
          <span className="font-display text-sm font-semibold uppercase tracking-wide text-accent-soft">
            {t('session.superserie', { grupo: group.label })}
          </span>
          {complete ? (
            <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-success">
              <CheckCheck className="size-3" aria-hidden /> {t('session.completada')}
            </span>
          ) : null}
        </div>
      )}
      {group.exercises.map((ex) => (
        <ExerciseBlock
          key={ex.exerciseId}
          exerciseId={ex.exerciseId}
          prMap={prMap}
          showRpe={showRpe}
          showRir={showRir}
          showLoadSuggestion={showLoadSuggestion}
          loadProgressionPct={loadProgressionPct}
          units={units}
          isCardio={categoryFor(ex.exerciseId) === 'cardio'}
          exerciseSlug={slugFor(ex.exerciseId)}
          note={noteFor(ex.exerciseId)}
          deloadActive={deloadActive}
          bodyWeight={bodyWeight}
          recentTopSetAvgKg={loadAverages?.get(ex.exerciseId) ?? 0}
          liveSuggestion={suggestions?.get(ex.exerciseId)}
          onSuggestionApply={onSuggestionApply}
          onSuggestionWarmup={onSuggestionWarmup}
          onCompleteExercise={onCompleteExercise}
          onSetCompleted={onSetCompleted}
          onRemoveRequest={onRemoveRequest}
          onSetRemoveRequest={onSetRemoveRequest}
        />
      ))}
    </div>
  )
}, slidePropsEqual)
