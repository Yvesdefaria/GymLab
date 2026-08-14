// Página ficha de ejercicio (/ejercicios/:slug): mejor marca (PR), evolución 1RM, técnica y nota.
import { useEffect, useMemo, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Dumbbell, StickyNote, Trophy, Play, Target, TrendingUp, Lightbulb, AlertTriangle } from 'lucide-react'
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
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { Units } from '@/domain/settings'
import type { MuscleGroup } from '@/domain/types'
import { localizeExerciseDetail, localizeMuscleGroup, localizeEquipment } from '@/i18n/catalog'
import { staggerSlide } from '@/lib/animations'

// Convierte kg almacenados a la unidad de display y formatea sin decimales si es entero.
const fmtWeight = (kg: number, units: Units): string => {
  const v = applyUnits(kg, units)
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

// Ficha de ejercicio: junta PR, historial de series y nota, y registra la visita como reciente.
export const EjercicioDetailPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { slug } = useParams()
  const { record } = useExerciseRecents()

  const { exercise, lastSets, exerciseSets, workouts } = useExerciseDetail(slug)
  // Overlay EN del catálogo: nombre, instrucciones y pasos detallados traducidos en render.
  const localized = exercise ? localizeExerciseDetail(exercise, lang) : undefined

  const notes = useExerciseNote(exercise?.id ?? 0)
  const { prMap } = usePRs()
  const { settings } = useSettings()

  // Referencias a los pasos de técnica para animarlos en cadena al entrar.
  const stepRefs = useRef<(HTMLLIElement | null)[]>([])

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

  // Anima los pasos de técnica en cadena (slide desde abajo) al entrar en la ficha.
  useEffect(() => {
    const els = stepRefs.current.filter((el): el is HTMLLIElement => el !== null)
    if (els.length > 0) staggerSlide(els, 'up', { staggerDelay: 60 })
  }, [exercise?.id])

  // Sin ejercicio (slug inválido): muestra estado vacío en vez de romper la pantalla.
  if (!exercise) {
    return (
      <div>
        <AppHeader title={t('ejercicios.tituloSingular')} />
        <div className="p-4">
          <BackLink to="/ejercicios" />
          <div className="mt-4 panel rounded-2xl p-5 text-center">
            <p className="text-sm text-muted">{t('ejercicios.noEncontrado')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHeader
        title={localized?.name ?? exercise.name}
        subtitle={`${localizeMuscleGroup(exercise.muscleGroup, lang)} · ${localizeEquipment(exercise.equipment, lang)}`}
      />
      <div className="space-y-4 p-4">
        <BackLink to="/ejercicios" label={t('ejercicios.todos')} />

        <ExerciseMedia name={localized?.name ?? exercise.name} imageUrls={exercise.imageUrls} />

        {pr ? (
          <section className="rounded-2xl border border-cta/40 bg-cta/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-cta" aria-hidden />
                <span className="font-display text-sm font-semibold text-accent">
                  {t('ejercicios.detalle.mejorMarca')}
                </span>
              </div>
              <span className="chip">
                {formatDate(pr.date, lang, { day: 'numeric', month: 'short' })}
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
              {t('ejercicios.detalle.e1rmEstimado', {
                peso: fmtWeight(pr.estimated1RM, settings.units),
                unidad: formatUnits(settings.units),
              })}
            </p>
          </section>
        ) : !hasHistory ? (
          <section className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gold/40 bg-bg-elevated/50 px-4 py-6 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-cta/15">
              <Target className="size-5 text-cta" aria-hidden />
            </span>
            <p className="font-display text-sm font-semibold text-fg">{t('ejercicios.detalle.sinHistorial')}</p>
            <p className="max-w-xs text-xs leading-relaxed text-muted">
              {t('ejercicios.detalle.sinHistorialDesc')}
            </p>
            <Link
              to="/"
              className="mt-1 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-cta px-4 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90"
            >
              <Play className="size-4" aria-hidden />
              {t('ejercicios.detalle.iniciarEntreno')}
            </Link>
          </section>
        ) : (
          <section className="panel rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <Target className="size-5 text-accent" aria-hidden />
              <span className="font-display text-sm font-semibold text-accent">
                {t('ejercicios.detalle.sinMejorMarca')}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              {t('ejercicios.detalle.sinMejorMarcaDesc')}
            </p>
          </section>
        )}

        {e1rmSeries.length > 0 && (
          <section className="panel rounded-2xl p-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="size-5 text-accent" aria-hidden />
              <span className="font-display text-sm font-semibold text-accent">
                {t('ejercicios.detalle.evolucion1rm')}
              </span>
            </div>
            <E1rmChart points={e1rmSeries} />
          </section>
        )}

        <section className="panel rounded-2xl p-4">
          <div className="mb-1 flex items-center gap-2">
            <Dumbbell className="size-5 text-accent" />
            <span className="font-display text-sm font-semibold text-accent">{t('ejercicios.detalle.musculoTrabajado')}</span>
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
            <span className="font-display text-sm font-semibold text-accent">{t('ejercicios.detalle.tecnica')}</span>
          </div>
          {localized?.detailedSteps && localized.detailedSteps.length > 0 ? (
            <ol className="space-y-4">
              {localized.detailedSteps.map((s) => (
                <li
                  key={s.step}
                  ref={(el) => {
                    if (el) stepRefs.current[s.step - 1] = el
                  }}
                  className="flex gap-3"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-cta/15 text-xs font-bold text-cta">
                    {s.step}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed text-fg">{s.instruction}</p>
                    {s.tip ? (
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-accent-soft">
                        <Lightbulb className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                        <span>{s.tip}</span>
                      </p>
                    ) : null}
                    {s.warning ? (
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-danger">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                        <span>{s.warning}</span>
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm leading-relaxed text-fg">{localized?.instructions ?? exercise.instructions}</p>
          )}
        </div>

        <div className="panel rounded-2xl p-4">
          <div className="mb-2 flex items-center gap-2">
            <StickyNote className="size-5 text-accent" />
            <span className="font-display text-sm font-semibold text-accent">{t('ejercicios.detalle.miNota')}</span>
          </div>
          <textarea
            value={notes.note}
            onChange={(e) => void notes.setNote(e.target.value)}
            rows={3}
            placeholder={t('ejercicios.detalle.notaPlaceholder')}
            aria-label={t('ejercicios.detalle.notaAria')}
            className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
          />
          <p className="mt-1 text-xs text-muted">{t('ejercicios.detalle.notaAyuda')}</p>
        </div>

        <div className="flex gap-2">
          <span className="rounded-full bg-bg px-3 py-1 text-xs font-medium capitalize text-muted">
            {localizeMuscleGroup(exercise.muscleGroup, lang)}
          </span>
          <span className="rounded-full bg-bg px-3 py-1 text-xs font-medium capitalize text-muted">
            {localizeEquipment(exercise.equipment, lang)}
          </span>
        </div>
      </div>
    </div>
  )
}
