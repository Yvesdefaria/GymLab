// Planificador de rutinas: wizard de 3 pasos para generar rutina semanal.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Sparkles } from 'lucide-react'
import { generateRoutine, type PlannedDay } from '@/domain/routinePlanner'
import { useEquipmentStore } from '@/store/equipmentStore'
import { EquipmentFilter } from '@/components/equipment/EquipmentFilter'
import type { Level, Objective } from '@/domain/types'

const levels: Level[] = ['principiante', 'intermedio', 'avanzado']
const objectives: Objective[] = ['fuerza', 'volumen', 'resistencia', 'definicion', 'general']
const dayOptions = [3, 4, 5, 6]

export const RoutinePlanner = () => {
  const { t } = useTranslation()
  const { selected: equipment } = useEquipmentStore()
  const [step, setStep] = useState(0)
  const [level, setLevel] = useState<Level>('principiante')
  const [objective, setObjective] = useState<Objective>('volumen')
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [result, setResult] = useState<PlannedDay[] | null>(null)

  const generate = () => {
    const routine = generateRoutine({ level, objective, equipment, daysPerWeek })
    setResult(routine)
    setStep(3)
  }

  // Paso 0: Nivel.
  if (step === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="kicker">{t('planner.title')}</p>
        <p className="text-xs text-muted">{t('planner.step1')}</p>
        <div className="flex flex-col gap-2">
          {levels.map((l) => (
            <button
              key={l}
              onClick={() => { setLevel(l); setStep(1) }}
              className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                level === l
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border/30 bg-bg-elevated/30 text-muted'
              }`}
            >
              {l === 'principiante' ? t('planner.levels.principiante') : l === 'intermedio' ? t('planner.levels.intermedio') : t('planner.levels.avanzado')}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Paso 1: Objetivo.
  if (step === 1) {
    return (
      <div className="flex flex-col gap-4">
        <p className="kicker">{t('planner.title')}</p>
        <p className="text-xs text-muted">{t('planner.step2')}</p>
        <div className="flex flex-col gap-2">
          {objectives.map((o) => (
            <button
              key={o}
              onClick={() => { setObjective(o); setStep(2) }}
              className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                objective === o
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border/30 bg-bg-elevated/30 text-muted'
              }`}
            >
              {o === 'fuerza' ? t('planner.objectives.fuerza') : o === 'volumen' ? t('planner.objectives.volumen') : o === 'resistencia' ? t('planner.objectives.resistencia') : o === 'definicion' ? t('planner.objectives.definicion') : t('planner.objectives.general')}
            </button>
          ))}
        </div>
        <button onClick={() => setStep(0)} className="flex items-center gap-1 text-xs text-muted">
          <ChevronLeft className="size-3" /> {t('planner.back')}
        </button>
      </div>
    )
  }

  // Paso 2: Días + equipamiento.
  if (step === 2) {
    return (
      <div className="flex flex-col gap-4">
        <p className="kicker">{t('planner.title')}</p>
        <p className="text-xs text-muted">{t('planner.step3')}</p>
        <div className="flex gap-1.5">
          {dayOptions.map((d) => (
            <button
              key={d}
              onClick={() => setDaysPerWeek(d)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-[0.65rem] font-medium transition-colors ${
                daysPerWeek === d
                  ? 'bg-accent text-accent-fg'
                  : 'bg-bg-elevated/50 text-muted'
              }`}
            >
              {d === 3 ? t('planner.days3') : d === 4 ? t('planner.days4') : d === 5 ? t('planner.days5') : t('planner.days6')}
            </button>
          ))}
        </div>
        <EquipmentFilter />
        <div className="flex items-center gap-2">
          <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-muted">
            <ChevronLeft className="size-3" /> {t('planner.back')}
          </button>
          <button
            onClick={generate}
            disabled={equipment.length === 0}
            className="flex-1 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-accent-fg disabled:opacity-50"
          >
            {t('planner.generate')}
          </button>
        </div>
      </div>
    )
  }

  // Paso 3: Resultado.
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-accent" aria-hidden />
        <p className="kicker">{t('planner.result')}</p>
      </div>
      {result?.map((day) => (
        <div key={day.dayNumber} className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2.5">
          <p className="text-xs font-semibold text-fg">
            {day.dayNumber === 1 ? t('planner.day1') : day.dayNumber === 2 ? t('planner.day2') : day.dayNumber === 3 ? t('planner.day3') : day.dayNumber === 4 ? t('planner.day4') : day.dayNumber === 5 ? t('planner.day5') : t('planner.day6')} — {day.muscleGroups.map((g) => g === 'pecho' ? t('muscle.pecho') : g === 'espalda' ? t('muscle.espalda') : g === 'biceps' ? t('muscle.biceps') : g === 'triceps' ? t('muscle.triceps') : g === 'hombro' ? t('muscle.hombro') : g === 'pierna' ? t('muscle.pierna') : g === 'gluteo' ? t('muscle.gluteo') : g === 'abdomen' ? t('muscle.abdomen') : g === 'trapecios' ? t('muscle.trapecios') : t('muscle.antebrazo')).join(', ')}
          </p>
          <div className="mt-1.5 flex flex-col gap-1">
            {day.exercises.map((ex, i) => (
              <p key={i} className="text-[0.6rem] text-muted">
                {ex.muscleGroup === 'pecho' ? t('muscle.pecho') : ex.muscleGroup === 'espalda' ? t('muscle.espalda') : ex.muscleGroup === 'biceps' ? t('muscle.biceps') : ex.muscleGroup === 'triceps' ? t('muscle.triceps') : ex.muscleGroup === 'hombro' ? t('muscle.hombro') : ex.muscleGroup === 'pierna' ? t('muscle.pierna') : ex.muscleGroup === 'gluteo' ? t('muscle.gluteo') : ex.muscleGroup === 'abdomen' ? t('muscle.abdomen') : ex.muscleGroup === 'trapecios' ? t('muscle.trapecios') : t('muscle.antebrazo')} · {ex.sets}×{ex.reps} · {ex.equipment}
              </p>
            ))}
          </div>
        </div>
      ))}
      <button onClick={() => { setResult(null); setStep(0) }} className="text-xs text-muted">
        {t('planner.restart')}
      </button>
    </div>
  )
}
