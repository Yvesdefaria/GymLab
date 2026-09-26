// Preview del plan (dirección A): una card por día con los músculos derivados de sus
// ítems. El nombre del ejercicio y la etiqueta del músculo los resuelve el contenedor
// con closures: el componente no conoce ni el catálogo ni el idioma.
import type { MuscleGroup } from '@/domain/types'
import type { RoutinePlan } from '@/domain/routineResolution'
import { PlanDayCard } from './PlanDayCard'

interface PlanPreviewProps {
  plan: RoutinePlan
  exerciseName: (exerciseId: number) => string
  exerciseGroup: (exerciseId: number) => MuscleGroup | undefined
  muscleLabel: (group: MuscleGroup) => string
}

export const PlanPreview = ({ plan, exerciseName, exerciseGroup, muscleLabel }: PlanPreviewProps) => (
  <div className="flex flex-col gap-2">
    {plan.days.map((day) => {
      const groups = [
        ...new Set(day.items.map((item) => exerciseGroup(item.exerciseId)).filter((g): g is MuscleGroup => !!g)),
      ]
      return (
        <PlanDayCard
          key={day.dayNumber}
          name={day.name}
          muscles={groups.map(muscleLabel)}
          estimatedMinutes={day.estimatedMinutes}
          items={day.items.map((item) => ({ ...item, name: exerciseName(item.exerciseId) }))}
        />
      )
    })}
  </div>
)
