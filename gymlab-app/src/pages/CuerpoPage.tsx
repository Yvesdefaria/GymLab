// Página /cuerpo (F132.5): mapa muscular como héroe, selector frente/espalda,
// detalle del músculo en hairline y filas hacia peso y fotos. El mapa conserva
// la fatiga (no volumen) para no duplicar la tab Cuerpo de Estadísticas.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { InfoTip } from '@/components/ui/InfoTip'
import { MuscleDummy } from '@/components/body/MuscleDummy'
import { CuerpoLinks } from '@/components/body/CuerpoLinks'
import { CuerpoSelected } from '@/components/body/CuerpoSelected'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { useAchievementsData } from '@/hooks/useAchievementsData'
import { fatigueMap, lastTrainedByMuscle } from '@/domain/muscleFatigue'
import { fatigueCounts } from '@/domain/bodyProgress'
import type { MuscleGroup } from '@/domain/types'
import { diffLocalDays, toLocalDateStr } from '@/domain/dates'

export const CuerpoPage = () => {
  const { t } = useTranslation()
  const [view, setView] = useState<'front' | 'back'>('front')
  const [selected, setSelected] = useState<MuscleGroup | null>(null)

  const { exercises } = useExerciseCatalog()
  // Workouts y series completadas vienen de la capa única; el mapa muscular ya está
  // resuelto ahí (exerciseMuscles), así que no se reconstruye desde el catálogo.
  const { workouts, completedSets, exerciseMuscles } = useAchievementsData()

  // Fatiga derivada de entrenos: último día por músculo y mapa de fatiga para la silueta.
  const lastBy = useMemo(
    () => lastTrainedByMuscle(workouts, completedSets, exerciseMuscles),
    [workouts, completedSets, exerciseMuscles],
  )
  const fatigue = useMemo(() => fatigueMap(lastBy), [lastBy])
  const counts = useMemo(() => fatigueCounts(fatigue), [fatigue])

  // Detalle del músculo seleccionado: ejercicios del grupo y días desde el último entreno.
  const groupExercises = selected
    ? exercises.filter((e) => e.muscleGroup === selected)
    : []

  const lastDate = selected ? lastBy[selected] ?? null : null
  const daysAgo = lastDate ? diffLocalDays(lastDate, toLocalDateStr()) : null

  // Resumen honesto: los grupos sin datos no cuentan como recuperados.
  const summary = useMemo(() => {
    if (counts.noData === 10) return t('cuerpo.sinDatosFatiga')
    const parts: string[] = []
    if (counts.fresh) parts.push(t('cuerpo.recuperados', { count: counts.fresh }))
    if (counts.warm) parts.push(t('cuerpo.activos', { count: counts.warm }))
    if (counts.fatigued) parts.push(t('cuerpo.fatigados', { count: counts.fatigued }))
    if (counts.sore) parts.push(t('cuerpo.muyRecientes', { count: counts.sore }))
    if (counts.noData) parts.push(t('cuerpo.sinDatosCount', { count: counts.noData }))
    return parts.join(' · ')
  }, [counts, t])

  return (
    <div>
      <AppHeader
        kicker={t('cuerpo.kicker')}
        title={t('cuerpo.titulo')}
        actions={<InfoTip id="cuerpoFatiga" />}
      />
      <div className="px-4 pb-24">
        <BackLink to="/mas" />

        <div
          role="group"
          aria-label={t('cuerpo.vistaAria')}
          className="mb-2 mt-1 grid grid-cols-2 gap-1 rounded-xl border border-border/40 p-1"
        >
          {(['front', 'back'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                view === v ? 'bg-gold/12 text-gold-bright' : 'text-muted'
              }`}
            >
              {v === 'front' ? t('cuerpo.frente') : t('cuerpo.espalda')}
            </button>
          ))}
        </div>

        <MuscleDummy
          fatigue={fatigue}
          view={view}
          selected={selected}
          onSelect={(mg) => setSelected((prev) => (prev === mg ? null : mg))}
        />
        <p className="mt-1 text-center text-[10px] text-muted">{summary}</p>

        <CuerpoSelected
          selected={selected}
          fatigue={fatigue}
          lastDate={lastDate}
          daysAgo={daysAgo}
          exercises={groupExercises}
        />

        <CuerpoLinks />
      </div>
    </div>
  )
}
