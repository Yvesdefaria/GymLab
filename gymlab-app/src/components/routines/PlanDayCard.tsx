// Día del resultado del plan: hairline + ejercicios en filas con la carga a la derecha.
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
    <section className="border-t border-border/40 pt-3">
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="min-w-0 truncate font-display text-[13px] font-medium text-fg">
          {name}
          {muscles.length > 0 ? (
            <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
              · {muscles.join(' · ')}
            </span>
          ) : null}
        </h3>
        <span className="shrink-0 text-[10px] tabular-nums text-muted">
          {t('planner.estimated', { min: estimatedMinutes })}
        </span>
      </header>
      <ul className="mt-1">
        {items.map((item, index) => (
          <li
            key={`${item.exerciseId}-${index}`}
            className="flex items-baseline justify-between gap-3 border-b border-border/30 py-2 last:border-b-0"
          >
            <span className="min-w-0 truncate text-[12.5px] text-fg">{item.name}</span>
            <b className="shrink-0 text-[11px] font-semibold tabular-nums text-accent-soft">
              {item.targetSets}×{item.targetReps}
            </b>
          </li>
        ))}
      </ul>
    </section>
  )
}
