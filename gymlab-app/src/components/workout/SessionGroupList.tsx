// Lista de grupos de la sesión: agrupa los ejercicios por superset, renderiza cada uno
// con su cabecera/badge y auto-desplaza la vista al siguiente grupo incompleto al cerrar uno.
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCheck, Link2 } from 'lucide-react'
import { ExerciseBlock } from '@/components/workout/ExerciseBlock'
import { groupExercises, isGroupComplete } from '@/domain/sessionGroups'
import type { ActiveExercise, ActiveSet } from '@/store/activeWorkoutStore'
import type { Units } from '@/domain/settings'
import type { PRRecord } from '@/domain/types'

interface SessionGroupListProps {
  exercises: ActiveExercise[]
  prMap: Map<number, PRRecord>
  showRpe: boolean
  showRir: boolean
  units: Units
  categoryFor: (exerciseId: number) => string | undefined
  slugFor: (exerciseId: number) => string | undefined
  noteFor: (exerciseId: number) => string | undefined
  deloadActive?: boolean
  onCompleteExercise: (exerciseId: number) => void
  onSetCompleted: (set: ActiveSet, completed: boolean) => void
  onRemoveRequest: (exerciseId: number) => void
  onSetRemoveRequest: (exerciseId: number, setId: string) => void
}

export const SessionGroupList = ({
  exercises,
  prMap,
  showRpe,
  showRir,
  units,
  categoryFor,
  slugFor,
  noteFor,
  deloadActive,
  onCompleteExercise,
  onSetCompleted,
  onRemoveRequest,
  onSetRemoveRequest,
}: SessionGroupListProps) => {
  const { t } = useTranslation()
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const focusedGroups = useRef<Set<string>>(new Set())
  const isFirstRun = useRef(true)
  const groups = useMemo(() => groupExercises(exercises), [exercises])

  // Auto-scroll: al completar un grupo entero, lleva la vista al siguiente grupo incompleto.
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    for (const group of groups) {
      if (focusedGroups.current.has(group.key)) continue
      if (!isGroupComplete(group)) break
      focusedGroups.current.add(group.key)
      const idx = groups.findIndex((g) => g.key === group.key)
      const next = groups.slice(idx + 1).find((g) => !isGroupComplete(g))
      if (next) {
        const smooth = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth'
        groupRefs.current[next.key]?.scrollIntoView({ behavior: smooth, block: 'center' })
      }
      break
    }
  }, [groups])

  return (
    <>
      {groups.map((group) => {
        const isSuper = group.label !== null
        const complete = isGroupComplete(group)
        return (
          <div
            key={group.key}
            ref={(el) => {
              groupRefs.current[group.key] = el
            }}
            className={
              isSuper
                ? `space-y-3 rounded-2xl border p-2 ${
                    complete ? 'border-success/40 bg-success/5' : 'border-cta/40 bg-cta/5'
                  }`
                : undefined
            }
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
                exercise={ex}
                prMap={prMap}
                showRpe={showRpe}
                showRir={showRir}
                units={units}
                isCardio={categoryFor(ex.exerciseId) === 'cardio'}
                exerciseSlug={slugFor(ex.exerciseId)}
                note={noteFor(ex.exerciseId)}
                deloadActive={deloadActive}
                onCompleteExercise={() => onCompleteExercise(ex.exerciseId)}
                onSetCompleted={onSetCompleted}
                onRemoveRequest={() => onRemoveRequest(ex.exerciseId)}
                onSetRemoveRequest={(exerciseId, setId) => onSetRemoveRequest(exerciseId, setId)}
              />
            ))}
          </div>
        )
      })}
    </>
  )
}