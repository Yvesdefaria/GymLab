// Hechos de la ficha: pills de músculo trabajado y equipo requerido.
import { localizeEquipment, localizeMuscleGroup } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'
import type { Equipment, MuscleGroup } from '@/domain/types'

export const ExerciseMetaChips = ({
  muscleGroup,
  equipment,
  lang,
}: {
  muscleGroup: MuscleGroup
  equipment: Equipment
  lang: AppLanguage
}) => {
  return (
    <div className="flex gap-2">
      <span className="rounded-full bg-bg px-3 py-1 text-xs font-medium capitalize text-muted">
        {localizeMuscleGroup(muscleGroup, lang)}
      </span>
      <span className="rounded-full bg-bg px-3 py-1 text-xs font-medium capitalize text-muted">
        {localizeEquipment(equipment, lang)}
      </span>
    </div>
  )
}