// Filtro de equipamiento: chips con iconos de equipo.
import { useTranslation } from 'react-i18next'
import {
  Dumbbell,
  CircleDot,
  Cable,
  Settings,
  User,
  Armchair,
  Circle,
  Waves,
  HelpCircle,
} from 'lucide-react'
import { EQUIPMENT_OPTIONS } from '@/domain/catalog'
import type { Equipment } from '@/domain/types'
import { useEquipmentStore } from '@/store/equipmentStore'

const equipmentIcon: Record<Equipment, typeof Dumbbell> = {
  barra: Dumbbell,
  mancuernas: CircleDot,
  maquina: Settings,
  polea: Cable,
  'peso corporal': User,
  banco: Armchair,
  kettlebell: Circle,
  banda: Waves,
  otro: HelpCircle,
}

export const EquipmentFilter = () => {
  const { t } = useTranslation()
  const { selected, toggle } = useEquipmentStore()

  return (
    <div className="flex flex-wrap gap-1.5">
      {EQUIPMENT_OPTIONS.map((eq) => {
        const Icon = equipmentIcon[eq]
        const isActive = selected.includes(eq)
        return (
          <button
            key={eq}
            onClick={() => toggle(eq)}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.65rem] font-medium transition-colors ${
              isActive
                ? 'bg-accent text-accent-fg'
                : 'bg-bg-elevated/50 text-muted hover:bg-bg-elevated'
            }`}
          >
            <Icon className="size-3.5" aria-hidden />
            <span>{t(`equipment.${eq}`)}</span>
          </button>
        )
      })}
    </div>
  )
}
