// Página ficha de ejercicio (/ejercicios/:slug): media como héroe, stat row de marca,
// evolución e1RM sin tarjeta, técnica, músculos y nota. Los hooks de dominio y la visita
// reciente viven aquí; cada bloque es presentacional y recibe solo props.
import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { UndoToast } from '@/components/ui/UndoToast'
import { ExerciseMedia } from '@/components/exercise/ExerciseMedia'
import { ExercisePrCard } from '@/components/exercise/ExercisePrCard'
import { ExerciseMuscleCard } from '@/components/exercise/ExerciseMuscleCard'
import { ExerciseTechniqueCard } from '@/components/exercise/ExerciseTechniqueCard'
import { ExerciseNoteCard } from '@/components/exercise/ExerciseNoteCard'
import { E1rmChart } from '@/components/profile/E1rmChart'
import { RoutineDestinationSheet } from '@/components/routines/RoutineDestinationSheet'
import { StatsStatRow } from '@/components/stats/StatsStatRow'
import { useExerciseDetail } from '@/hooks/useExerciseDetail'
import { useRecentLoadHistory } from '@/hooks/useRecentLoadHistory'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { useCatalogAdd } from '@/hooks/useCatalogAdd'
import { buildE1rmSeries } from '@/domain/e1rm'
import { buildZoneAdvisories } from '@/domain/zoneAdvisory'
import { useExerciseRecents } from '@/hooks/useExerciseFavorites'
import { useExerciseNote } from '@/hooks/useExerciseNote'
import { useSettings } from '@/hooks/useSettings'
import { prRepo } from '@/data/repositories'
import { applyUnits, formatUnits } from '@/domain/settings'
import { formatDate, formatNumber } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { Units } from '@/domain/settings'
import type { ExerciseStep } from '@/domain/types'
import { localizeCategory, localizeExerciseDetail, localizeEquipmentList, localizeMuscleGroup } from '@/i18n/catalog'

// Pasos vacíos compartidos: el efecto de stagger del bloque de técnica compara identidad.
const EMPTY_STEPS: ExerciseStep[] = []

// Peso en la unidad activa, sin decimales si es entero (misma regla que la ficha anterior).
const fmtWeight = (kg: number, units: Units, lang: AppLanguage): string => {
  const value = applyUnits(kg, units)
  return formatNumber(value, lang, { maximumFractionDigits: value % 1 === 0 ? 0 : 1 })
}

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
  const { settings } = useSettings()
  const { add, pending, chooseDay, closeSheet } = useCatalogAdd()

  // PR del ejercicio consultado por índice (exerciseId), sin leer el resto de la tabla.
  const pr = useLiveQuery(
    () => (exercise ? prRepo.getByExercise(exercise.id) : undefined),
    [exercise?.id]
  )
  const hasHistory = exercise ? lastSets.has(exercise.id) : false
  const sessions = useMemo(
    () => new Set(exerciseSets.map((set) => set.workoutId)).size,
    [exerciseSets]
  )

  // Pasos de técnica (identidad estable → la animación de stagger del bloque no se re-dispara al teclear).
  const steps = localized?.detailedSteps ?? EMPTY_STEPS

  // Serie temporal del 1RM estimado, emparejando cada sesión de series con su fecha de workout.
  const e1rmSeries = useMemo(
    () => buildE1rmSeries(exerciseSets, new Map(workouts.map((w) => [w.id, w]))),
    [exerciseSets, workouts]
  )

  // F122: aviso de zona — velocidad del peso de trabajo de los ejercicios de la misma zona
  // (se reutiliza la consulta de historial reciente de la app). Informativo y discreto:
  // el freno real es por ejercicio; esto solo cuenta que la zona viene rápida.
  const { setsByExercise } = useRecentLoadHistory()
  const { exercises: catalogExercises } = useExerciseCatalog()
  const zoneAdvisories = useMemo(() => {
    if (!exercise) return []
    const muscleByExerciseId = new Map(catalogExercises.map((e) => [e.id, e.muscleGroup]))
    return buildZoneAdvisories({ setsByExercise, muscleByExerciseId }).filter(
      (advisory) => advisory.zone === exercise.muscleGroup
    )
  }, [exercise, setsByExercise, catalogExercises])

  // Marca el ejercicio como «reciente» cada vez que se visita la ficha.
  useEffect(() => {
    if (exercise) void record(exercise.id)
  }, [exercise, record])

  // Sin ejercicio (slug inválido): estado vacío en vez de romper la pantalla.
  if (!exercise) {
    return (
      <div>
        <AppHeader kicker={t('ejercicios.kicker')} title={t('ejercicios.tituloSingular')} />
        <div className="p-4">
          <BackLink to="/ejercicios" />
          <p className="mt-6 border-t border-border/40 pt-6 text-sm text-muted">
            {t('ejercicios.noEncontrado')}
          </p>
        </div>
      </div>
    )
  }

  const name = localized?.name ?? exercise.name
  const units = settings.units

  return (
    <div>
      <AppHeader
        kicker={t('ejercicios.tituloSingular')}
        title={name}
        subtitle={`${localizeMuscleGroup(exercise.muscleGroup, lang)} · ${localizeEquipmentList(exercise.equipment, lang)} · ${localizeCategory(exercise.category ?? 'strength', lang)}`}
      />
      <div className="pb-24">
        <div className="px-4">
          <BackLink to="/ejercicios" label={t('ejercicios.todos')} />
        </div>

        <ExerciseMedia name={name} imageUrls={exercise.imageUrls} />

        <div className="space-y-4 px-4">
          <div data-testid="exercise-stats">
            <StatsStatRow
              items={[
                { value: pr ? fmtWeight(pr.estimated1RM, units, lang) : '—', label: t('ejercicios.detalle.statE1rm') },
                { value: pr ? `${fmtWeight(pr.weightKg, units, lang)} × ${pr.reps}` : '—', label: t('ejercicios.detalle.statPr') },
                { value: String(sessions), label: t('ejercicios.detalle.sesiones') },
              ]}
            />
          </div>
          {pr ? (
            <p className="text-[10px] text-muted">
              {t('ejercicios.detalle.mejorMarca')} ·{' '}
              {formatDate(pr.date, lang, { day: 'numeric', month: 'short', year: 'numeric' })} ·{' '}
              {formatUnits(units)}
            </p>
          ) : (
            <ExercisePrCard hasHistory={hasHistory} />
          )}

          {e1rmSeries.length > 0 && <E1rmChart points={e1rmSeries} variant="minimal" />}

          {zoneAdvisories.map((advisory) => (
            <p key={advisory.zone} className="text-[11px] text-muted">
              {t('ejercicios.detalle.zonaRapida', {
                zona: localizeMuscleGroup(advisory.zone, lang),
              })}
            </p>
          ))}

          <ExerciseMuscleCard muscleGroup={exercise.muscleGroup} muscleZones={exercise.muscleZones ?? []} lang={lang} />

          <ExerciseTechniqueCard steps={steps} fallback={localized?.instructions ?? exercise.instructions} />

          <ExerciseNoteCard note={notes.note} onChange={(v) => void notes.setNote(v)} />

          <button
            type="button"
            onClick={() => void add(exercise)}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-cta text-sm font-semibold text-on-gold transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden />
            {t('ejercicios.detalle.anadirRutina')}
          </button>
        </div>
      </div>

      {pending && (
        <RoutineDestinationSheet
          exerciseName={pending.name}
          onChooseDay={(dayId) => void chooseDay(dayId)}
          onClose={closeSheet}
        />
      )}

      <UndoToast />
    </div>
  )
}
