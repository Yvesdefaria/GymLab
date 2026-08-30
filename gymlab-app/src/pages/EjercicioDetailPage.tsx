// Página ficha de ejercicio (/ejercicios/:slug): PR, evolución 1RM, técnica y nota como
// composición de tarjetas. Los hooks de dominio y la visita reciente viven aquí; cada
// tarjeta es autocontenida/presentacional y recibe solo props.
import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { ExerciseMedia } from '@/components/exercise/ExerciseMedia'
import { ExercisePrCard } from '@/components/exercise/ExercisePrCard'
import { ExerciseMuscleCard } from '@/components/exercise/ExerciseMuscleCard'
import { ExerciseTechniqueCard } from '@/components/exercise/ExerciseTechniqueCard'
import { ExerciseNoteCard } from '@/components/exercise/ExerciseNoteCard'
import { ExerciseMetaChips } from '@/components/exercise/ExerciseMetaChips'
import { E1rmChart } from '@/components/profile/E1rmChart'
import { useExerciseDetail } from '@/hooks/useExerciseDetail'
import { buildE1rmSeries } from '@/domain/e1rm'
import { useExerciseRecents } from '@/hooks/useExerciseFavorites'
import { useExerciseNote } from '@/hooks/useExerciseNote'
import { usePRs } from '@/hooks/usePRs'
import { useSettings } from '@/hooks/useSettings'
import type { AppLanguage } from '@/domain/onboarding'
import type { ExerciseStep } from '@/domain/types'
import { localizeExerciseDetail, localizeEquipment, localizeMuscleGroup } from '@/i18n/catalog'

// Pasos vacíos compartidos: el efecto de stagger del bloque de técnica compara identidad.
const EMPTY_STEPS: ExerciseStep[] = []

// Ficha de ejercicio: junta PR, historial de series y nota, y registra la visita como reciente.
export const EjercicioDetailPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { slug } = useParams()
  const { record } = useExerciseRecents()

  const { exercise, lastSets, exerciseSets, workouts } = useExerciseDetail(slug)
  // Overlay EN del catálogo: nombre, instrucciones y pasos detallados traducidos en render.
  const localized = useMemo(
    () => (exercise ? localizeExerciseDetail(exercise, lang) : undefined),
    [exercise, lang]
  )

  const notes = useExerciseNote(exercise?.id ?? 0)
  const { prMap } = usePRs()
  const { settings } = useSettings()

  const pr = exercise ? prMap.get(exercise.id) : undefined
  const hasHistory = exercise ? lastSets.has(exercise.id) : false

  // Pasos de técnica (identidad estable → la animación de stagger del bloque no se re-dispara al teclear).
  const steps = localized?.detailedSteps ?? EMPTY_STEPS

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

        <ExercisePrCard pr={pr} hasHistory={hasHistory} units={settings.units} lang={lang} />

        {e1rmSeries.length > 0 && <E1rmChart points={e1rmSeries} />}

        <ExerciseMuscleCard muscleGroup={exercise.muscleGroup} />

        <ExerciseTechniqueCard
          steps={steps}
          fallback={localized?.instructions ?? exercise.instructions}
        />

        <ExerciseNoteCard note={notes.note} onChange={(v) => void notes.setNote(v)} />

        <ExerciseMetaChips muscleGroup={exercise.muscleGroup} equipment={exercise.equipment} lang={lang} />
      </div>
    </div>
  )
}
