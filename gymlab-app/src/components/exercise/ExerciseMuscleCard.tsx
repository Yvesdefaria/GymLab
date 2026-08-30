// Tarjeta «músculo trabajado» de la ficha: cabecera + diagrama muscular con el grupo resaltado.
import { useTranslation } from 'react-i18next'
import { Dumbbell } from 'lucide-react'
import { MuscleDummy } from '@/components/body/MuscleDummy'
import type { MuscleGroup } from '@/domain/types'

export const ExerciseMuscleCard = ({ muscleGroup }: { muscleGroup: MuscleGroup }) => {
  const { t } = useTranslation()
  return (
    <section className="panel-light rounded-2xl p-4">
      <div className="mb-1 flex items-center gap-2">
        <Dumbbell className="size-5 text-accent" />
        <span className="font-display text-sm font-semibold text-accent">{t('ejercicios.detalle.musculoTrabajado')}</span>
      </div>
      <MuscleDummy fatigue={{}} highlight={muscleGroup} showLegend={false} />
    </section>
  )
}