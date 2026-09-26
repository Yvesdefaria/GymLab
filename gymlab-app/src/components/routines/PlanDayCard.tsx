// Card de día del resultado del plan (dirección A): barra de acento a la izquierda,
// músculos junto al nombre y pill con los minutos estimados de la sesión.
import { useTranslation } from 'react-i18next'

export interface PlanDayCardItem {
  exerciseId: number
  name: string
  targetSets: number
  targetReps: number
}

interface PlanDayCardProps {
  name: string
  muscles: string[]
  estimatedMinutes: number
  items: PlanDayCardItem[]
}

export const PlanDayCard = ({ name, muscles, estimatedMinutes, items }: PlanDayCardProps) => {
  const { t } = useTranslation()
  return (
    <section className="rounded-2xl border border-border/30 border-l-[3px] border-l-accent bg-bg-elevated/30 px-3 py-3">
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-fg">
          {name}
          {muscles.length > 0 ? (
            <span className="ml-1 text-[11px] font-normal text-accent">· {muscles.join(' · ')}</span>
          ) : null}
        </h3>
        <span className="shrink-0 text-[11px] text-accent">{t('planner.estimated', { min: estimatedMinutes })}</span>
      </header>
      <ul className="mt-2 space-y-1">
        {items.map((item, index) => (
          <li key={`${item.exerciseId}-${index}`} className="flex items-baseline justify-between gap-2 text-xs text-muted">
            <span className="truncate">{item.name}</span>
            <b className="shrink-0 text-accent">
              {item.targetSets}×{item.targetReps}
            </b>
          </li>
        ))}
      </ul>
    </section>
  )
}
