// «Mi equipamiento»: chips multi-selección con el equipamiento declarado por el usuario.
// Es una preferencia persistida (equipmentStore) que guía al catálogo, no un filtro efímero:
// con la selección vacía no se filtra nada y se ve el catálogo completo.
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
import { HScroll } from '@/components/ui/HScroll'
import { Chip } from '@/components/ui/Chip'

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
  const selected = useEquipmentStore((s) => s.selected)
  const toggle = useEquipmentStore((s) => s.toggle)
  const clear = useEquipmentStore((s) => s.clear)

  return (
    <div className="space-y-1.5" role="group" aria-label={t('ejercicios.equipamiento.region')}>
      <HScroll className="pb-1">
        <Chip active={selected.length === 0} onClick={clear}>
          {t('ejercicios.equipamiento.todo')}
        </Chip>
        {EQUIPMENT_OPTIONS.map((eq) => {
          const Icon = equipmentIcon[eq]
          return (
            <Chip key={eq} active={selected.includes(eq)} onClick={() => toggle(eq)}>
              <span className="inline-flex items-center gap-1">
                <Icon className="size-3.5" aria-hidden />
                {t(`equipment.${eq}`)}
              </span>
            </Chip>
          )
        })}
      </HScroll>
      {selected.length > 0 && (
        <p className="px-1 text-[11px] text-muted">
          {t('ejercicios.equipamiento.filtrando', { count: selected.length })}
        </p>
      )}
    </div>
  )
}
