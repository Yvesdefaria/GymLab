// Chips de objetivo del catálogo: "Todos" + los 5 objetivos con su conteo de predefinidas.
import { useTranslation } from 'react-i18next'
import { Chip } from '@/components/ui/Chip'
import { HScroll } from '@/components/ui/HScroll'
import { OBJECTIVES } from '@/domain/catalog'
import type { AppLanguage } from '@/domain/onboarding'
import type { Objective } from '@/domain/types'
import { localizeObjective } from '@/i18n/catalog'

export const RoutineObjectiveChips = ({
  objective,
  counts,
  total,
  onChange,
  lang,
}: {
  objective: Objective | null
  counts: Record<Objective, number>
  total: number
  onChange: (value: Objective | null) => void
  lang: AppLanguage
}) => {
  const { t } = useTranslation()
  return (
    <HScroll className="py-1" >
      <Chip active={objective === null} onClick={() => onChange(null)}>
        {t('rutinas.todos')} <span className="ml-1 text-[10px] tabular-nums opacity-70">{total}</span>
      </Chip>
      {OBJECTIVES.map((obj) => (
        <Chip key={obj} active={objective === obj} onClick={() => onChange(obj)}>
          {localizeObjective(obj, lang)} <span className="ml-1 text-[10px] tabular-nums opacity-70">{counts[obj]}</span>
        </Chip>
      ))}
    </HScroll>
  )
}
