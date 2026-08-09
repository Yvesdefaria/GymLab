// Página ficha de ejercicio (/ejercicios/:slug): mejor marca (PR), evolución 1RM, técnica y nota.
import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Dumbbell, StickyNote, Trophy, Play, Target, TrendingUp } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { ExerciseMedia } from '@/components/exercise/ExerciseMedia'
import { MuscleDummy } from '@/components/body/MuscleDummy'
import { E1rmChart } from '@/components/profile/E1rmChart'
import { useExerciseDetail } from '@/hooks/useExerciseDetail'
import { buildE1rmSeries } from '@/domain/e1rm'
import { useExerciseRecents } from '@/hooks/useExerciseFavorites'
import { useExerciseNote } from '@/hooks/useExerciseNote'
import { usePRs } from '@/hooks/usePRs'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatUnits } from '@/domain/settings'
import type { Units } from '@/domain/settings'
import type { MuscleGroup } from '@/domain/types'
import { MUSCLE_GROUP_LABELS } from '@/domain/routines'

// Convierte kg almacenados a la unidad de display y formatea sin decimales si es entero.
const fmtWeight = (kg: number, units: Units): string => {
  const v = applyUnits(kg, units)
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

// Ficha de ejercicio: junta PR, historial de series y nota, y registra la visita como reciente.
export const EjercicioDetailPage = () => {
  const { slug } = useParams()
  const { record } = useExerciseRecents()

  const { exercise, lastSets, exerciseSets, workouts } = useExerciseDetail(slug)

  const notes = useExerciseNote(exercise?.id ?? 0)
  const { prMap } = usePRs()
  const { settings } = useSettings()

  const pr = exercise ? prMap.get(exercise.id) : undefined
  const hasHistory = exercise ? lastSets.has(exercise.id) : false

  // Serie temporal del 1RM estimado, emparejando cada sesión de series con su fecha de workout.
  const e1rmSeries = useMemo(
    () => buildE1rmSeries(exerciseSets, new Map(workouts.map((w) => [w.id, w]))),
    [exerciseSets, workouts]
  )

  // Marca el ejercicio como «reciente» cada vez que se visita la ficha.
  useEffect(() => {
    if (exercise) void record(exercise.id)
  }, [exercise, record])

  // Sin ejercicio (slug inválido): muestra estado vacío en vez de romper la pantalla.
  if (!exercise) {
    return (
      <div>
        <AppHeader title="Ejercicio" />
        <div className="p-4">
          <BackLink to="/ejercicios" />
          <div className="mt-4 panel rounded-2xl p-5 text-center">
            <p className="text-sm text-muted">Ejercicio no encontrado.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHeader
        title={exercise.name}
        subtitle={`${MUSCLE_GROUP_LABELS[exercise.muscleGroup] ?? exercise.muscleGroup} · ${exercise.equipment}`}
      />
      <div className="space-y-4 p-4">
        <BackLink to="/ejercicios" label="Todos los ejercicios" />

        <ExerciseMedia name={exercise.name} imageUrls={exercise.imageUrls} />

        {pr ? (
          <section className="rounded-2xl border border-cta/40 bg-cta/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-cta" aria-hidden />
                <span className="font-display text-sm font-semibold text-accent">
                  Mi mejor marca
                </span>
              </div>
              <span className="chip">
                {new Date(pr.date).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
            <p className="mt-2 stat-value text-3xl">
              {fmtWeight(pr.weightKg, settings.units)}
              <span className="text-lg text-muted">
                {' '}
                {formatUnits(settings.units)} × {pr.reps}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted">
              1RM estimado: {fmtWeight(pr.estimated1RM, settings.units)}{' '}
              {formatUnits(settings.units)}
            </p>
          </section>
        ) : !hasHistory ? (
          <section className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gold/40 bg-bg-elevated/50 px-4 py-6 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-cta/15">
              <Target className="size-5 text-cta" aria-hidden />
            </span>
            <p className="font-display text-sm font-semibold text-fg">Sin historial todavía</p>
            <p className="max-w-xs text-xs leading-relaxed text-muted">
              Tu primera marca empieza en cero. Registra tus series y guarda tu mejor marca aquí.
            </p>
            <Link
              to="/"
              className="mt-1 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-cta px-4 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90"
            >
              <Play className="size-4" aria-hidden />
              Iniciar entreno
            </Link>
          </section>
        ) : (
          <section className="panel rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <Target className="size-5 text-accent" aria-hidden />
              <span className="font-display text-sm font-semibold text-accent">
                Todavía sin mejor marca
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Tienes series registradas. Supera tu marca en la próxima sesión y aparecerá aquí.
            </p>
          </section>
        )}

        {e1rmSeries.length > 0 && (
          <section className="panel rounded-2xl p-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="size-5 text-accent" aria-hidden />
              <span className="font-display text-sm font-semibold text-accent">
                Evolución 1RM
              </span>
            </div>
            <E1rmChart points={e1rmSeries} />
          </section>
        )}

        <section className="panel rounded-2xl p-4">
          <div className="mb-1 flex items-center gap-2">
            <Dumbbell className="size-5 text-accent" />
            <span className="font-display text-sm font-semibold text-accent">Músculo trabajado</span>
          </div>
          <MuscleDummy
            fatigue={{}}
            highlight={exercise.muscleGroup as MuscleGroup}
            showLegend={false}
          />
        </section>

        <div className="panel rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-2">
            <Dumbbell className="size-5 text-accent" />
            <span className="font-display text-sm font-semibold text-accent">Técnica</span>
          </div>
          <p className="text-sm leading-relaxed text-fg">{exercise.instructions}</p>
        </div>

        <div className="panel rounded-2xl p-4">
          <div className="mb-2 flex items-center gap-2">
            <StickyNote className="size-5 text-accent" />
            <span className="font-display text-sm font-semibold text-accent">Mi nota</span>
          </div>
          <textarea
            value={notes.note}
            onChange={(e) => void notes.setNote(e.target.value)}
            rows={3}
            placeholder="Ej. agarre a 1,5 palmos, baja 2s..."
            aria-label="Mi nota del ejercicio"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
          />
          <p className="mt-1 text-xs text-muted">Se muestra en la sesión al usar este ejercicio.</p>
        </div>

        <div className="flex gap-2">
          <span className="rounded-full bg-bg px-3 py-1 text-xs font-medium capitalize text-muted">
            {exercise.muscleGroup}
          </span>
          <span className="rounded-full bg-bg px-3 py-1 text-xs font-medium capitalize text-muted">
            {exercise.equipment}
          </span>
        </div>
      </div>
    </div>
  )
}
